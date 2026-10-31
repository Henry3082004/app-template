import { createClient } from "jsr:@supabase/supabase-js@2";

// Phone + password sign-up for people who can't use Zalo (yet). The phone is only TYPED here, so it is stored as an UNVERIFIED contact
// (contacts.verified = false) and shown as "chưa xác thực" — the same rule as the Google sign-up. Only Zalo can verify a phone.
//
//   { phone, password, full_name, role, locale, business_name?, address?, city?, bio? }  →  { ok: true }   (the client then signs in with the password)
//
// The login e-mail uses its own domain (…@pw.viecthoivu.app), never the one Zalo accounts use (…@phone.viecthoivu.app), so a typed number can
// never collide with — or take the place of — a phone proven by Zalo. A phone already verified by Zalo is refused here.
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
  if (!/^[0-9]{9,15}$/.test(digits)) return null;
  return digits.startsWith("84") && digits.length !== 11 ? null : digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "BAD_REQUEST" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "SIGNUP_FAILED" }, 500);
  const admin = createClient(url, service, { auth: { persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "BAD_REQUEST" }, 400); }

  const digits = normalizePhone(body.phone);
  if (!digits) return json({ error: "INVALID_PHONE" }, 400);
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 72) return json({ error: "WEAK_PASSWORD" }, 400);
  const fullName = text(body.full_name, 80);
  if (!fullName) return json({ error: "NAME_REQUIRED" }, 400);
  const role = body.role === "employer" ? "employer" : body.role === "seeker" ? "seeker" : null;
  if (!role) return json({ error: "INVALID_ROLE" }, 400);
  const locale = body.locale === "en" ? "en" : "vi";

  // a daily cap per network address (and overall) so the endpoint can't be used to mass-create accounts
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const { data: allowed, error: hitErr } = await admin.rpc("ai_hit", { p_key: `su:${ip}`, p_cap: 20, p_total_cap: 6000 });
  if (hitErr) return json({ error: "SIGNUP_FAILED" }, 500);
  if (!allowed) return json({ error: "TOO_MANY" }, 429);

  // a number already proven by Zalo belongs to its owner
  const { data: verified } = await admin.from("contacts").select("user_id").eq("phone", "+" + digits).eq("verified", true).maybeSingle();
  if (verified) return json({ error: "PHONE_TAKEN" }, 409);

  const { data, error } = await admin.auth.admin.createUser({
    email: `${digits}@pw.viecthoivu.app`,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, via: "password" },
  });
  if (error || !data.user) {
    return /already|registered|exists/i.test(error?.message ?? "") ? json({ error: "PHONE_TAKEN" }, 409) : json({ error: "SIGNUP_FAILED" }, 500);
  }

  const uid = data.user.id;
  const profile = {
    id: uid,
    role,
    full_name: fullName,
    locale,
    business_name: role === "employer" ? text(body.business_name, 120) || null : null,
    address: role === "employer" ? text(body.address, 200) || null : null,
    city: text(body.city, 60) || null,
    auth_provider: "password",
  };
  const { error: pErr } = await admin.from("profiles").insert(profile);
  const { error: cErr } = pErr ? { error: null } : await admin.from("contacts").insert({ user_id: uid, phone: "+" + digits, verified: false });
  const { error: wErr } = pErr || cErr || role !== "seeker"
    ? { error: null }
    : await admin.from("worker_profiles").insert({ user_id: uid, bio: text(body.bio, 500) || null });
  if (pErr || cErr || wErr) {
    await admin.auth.admin.deleteUser(uid); // leave nothing half-made behind
    return json({ error: "SIGNUP_FAILED" }, 500);
  }
  return json({ ok: true });
});
