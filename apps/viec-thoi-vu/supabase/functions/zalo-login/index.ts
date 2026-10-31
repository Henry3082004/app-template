import { createClient } from "jsr:@supabase/supabase-js@2";

// Sign in / sign up with Zalo (Mini App). The phone number is NEVER taken from the client:
// the client only forwards Zalo's tokens, and this function asks Zalo's server who they belong to.
//
//   1) { access_token, phone_token }          → existing account: { token_hash, email } (client exchanges it for a session)
//                                              → new account:      { needs_signup, ticket, phone }
//   2) { ticket, role, full_name, ... }       → creates the account, returns { token_hash, email }
//
// The ticket is an HMAC-signed, 15-minute proof that Zalo verified this phone (keyed with ZALO_APP_SECRET).
// Every Zalo sign-in also records the account's Zalo id in zalo_links (asked from Zalo's server, never taken from the client), so the
// zalo-webhook function can find the account when Zalo reports that the user withdrew consent (user.revoke.consent).
// Needs the Edge Function secret ZALO_APP_SECRET (Zalo Mini App → Cài đặt → App Secret Key).
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function normalizePhone(raw: unknown): string | null {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "84" + digits.slice(1);
  return /^[0-9]{9,15}$/.test(digits) ? digits : null;
}

const enc = new TextEncoder();
async function hmacHex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const b64 = (s: string) => btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const unb64 = (s: string) => atob(s.replaceAll("-", "+").replaceAll("_", "/"));

async function makeTicket(phone: string, zid: string | null, secret: string): Promise<string> {
  const body = b64(JSON.stringify({ phone, zid, exp: Date.now() + 15 * 60_000 }));
  return `${body}.${await hmacHex(body, secret)}`;
}
async function readTicket(ticket: unknown, secret: string): Promise<{ phone: string | null; zid: string | null } | null> {
  if (typeof ticket !== "string") return null;
  const [body, sig] = ticket.split(".");
  if (!body || !sig) return null;
  const expect = await hmacHex(body, secret);
  let diff = expect.length ^ sig.length;
  for (let i = 0; i < expect.length; i++) diff |= expect.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
  if (diff !== 0) return null;
  try {
    const p = JSON.parse(unb64(body));
    return p.exp > Date.now() ? { phone: normalizePhone(p.phone), zid: typeof p.zid === "string" ? p.zid : null } : null;
  } catch {
    return null;
  }
}

/** Ask Zalo's server for the user's Zalo id (the userId Zalo's webhooks use). Best effort: sign-in never fails because of it. */
async function zaloIdFromZalo(accessToken: string): Promise<string | null> {
  try {
    const r = await fetch("https://graph.zalo.me/v2.0/me?fields=id", { headers: { access_token: accessToken } });
    const j = await r.json();
    const id = String(j?.id ?? j?.data?.id ?? "");
    return /^[0-9A-Za-z_-]{1,64}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Ask Zalo's server for the phone number behind the token pair. */
async function phoneFromZalo(accessToken: string, phoneToken: string, secret: string): Promise<string | null> {
  try {
    const r = await fetch("https://graph.zalo.me/v2.0/me/info", {
      headers: { access_token: accessToken, code: phoneToken, secret_key: secret },
    });
    const j = await r.json();
    if (j?.error && j.error !== 0) return null;
    return normalizePhone(j?.data?.number ?? j?.number);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const secret = Deno.env.get("ZALO_APP_SECRET");
  if (!secret) return json({ error: "ZALO_NOT_CONFIGURED" }, 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "BAD_REQUEST" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Who is this? Either a fresh Zalo verification, or a ticket from step 1.
  let digits: string | null;
  let zid: string | null = null;
  const signingUp = typeof body.ticket === "string";
  if (signingUp) {
    const t = await readTicket(body.ticket, secret);
    digits = t?.phone ?? null;
    zid = t?.zid ?? null;
    if (!digits) return json({ error: "TICKET_INVALID" }, 401);
  } else {
    const at = text(body.access_token, 2000), pt = text(body.phone_token, 2000);
    if (!at || !pt) return json({ error: "BAD_REQUEST" }, 400);
    digits = await phoneFromZalo(at, pt, secret);
    if (!digits) return json({ error: "ZALO_VERIFY_FAILED" }, 401);
    zid = await zaloIdFromZalo(at);
  }
  // remember which Zalo id this account is (best effort; a failure here never blocks the sign-in)
  const link = async (uid: string) => {
    if (!zid) return;
    try { await admin.from("zalo_links").upsert({ user_id: uid, zalo_id: zid, linked_at: new Date().toISOString() }, { onConflict: "user_id" }); } catch { /* best effort */ }
  };

  const email = `${digits}@phone.viecthoivu.app`;
  const mint = async (uid: string) => {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    const banned = u?.user?.banned_until && new Date(u.user.banned_until).getTime() > Date.now();
    if (banned) return json({ error: "ACCOUNT_DISABLED" }, 403);
    const loginEmail = u?.user?.email ?? email; // the account's real email (legacy accounts share the phone-based scheme)
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: loginEmail });
    if (error || !data?.properties?.hashed_token) return json({ error: "LOGIN_FAILED" }, 500);
    return json({ ok: true, token_hash: data.properties.hashed_token, email: loginEmail });
  };

  // Only phones VERIFIED by Zalo count as an account's identity (a typed phone can't take a verified one's place).
  const { data: existing } = await admin.from("contacts").select("user_id").eq("phone", "+" + digits).eq("verified", true).maybeSingle();
  if (existing) { // the phone is verified by Zalo, so this is the same person
    await link(existing.user_id);
    return mint(existing.user_id);
  }

  if (!signingUp) {
    return json({ ok: true, needs_signup: true, ticket: await makeTicket(digits, zid, secret), phone: digits });
  }

  // ── create the account ──
  const fullName = text(body.full_name, 80);
  if (!fullName) return json({ error: "NAME_REQUIRED" }, 400);
  const role = body.role === "employer" ? "employer" : body.role === "seeker" ? "seeker" : null;
  if (!role) return json({ error: "INVALID_ROLE" }, 400);
  const locale = body.locale === "en" ? "en" : "vi";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + crypto.randomUUID(), // nobody knows it; they sign in with Zalo
    email_confirm: true,
    user_metadata: { full_name: fullName, via: "zalo" },
  });
  if (error || !data.user) return json({ error: "SIGNUP_FAILED" }, 500);

  const uid = data.user.id;
  const profile = {
    id: uid,
    role,
    full_name: fullName,
    locale,
    business_name: role === "employer" ? text(body.business_name, 120) || null : null,
    address: role === "employer" ? text(body.address, 200) || null : null,
    city: text(body.city, 60) || null,
    auth_provider: "zalo",
  };
  const { error: pErr } = await admin.from("profiles").insert(profile);
  const { error: cErr } = pErr ? { error: null } : await admin.from("contacts").insert({ user_id: uid, phone: "+" + digits, verified: true });
  // worker details live in their own table (only businesses the worker applies to can read them)
  const { error: wErr } = pErr || cErr || role !== "seeker"
    ? { error: null }
    : await admin.from("worker_profiles").insert({ user_id: uid, bio: text(body.bio, 500) || null });
  if (pErr || cErr || wErr) {
    await admin.auth.admin.deleteUser(uid);
    return json({ error: "SIGNUP_FAILED" }, 500);
  }
  await link(uid);
  return mint(uid);
});
