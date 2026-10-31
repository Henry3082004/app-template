import { createClient } from "jsr:@supabase/supabase-js@2";

// Zalo Mini App webhook (Webhook URL in the Mini App settings). Zalo POSTs JSON events signed in the X-ZEvent-Signature header:
//   signature = sha256_hex( values of the body's fields, sorted by field name and joined (objects as JSON) + API Key )
// (Zalo docs "Hướng dẫn verify signature"). The API Key is the Mini App's Open API key, stored in the secret ZALO_API_KEY.
//
// Handled event — "user rút lại sự đồng ý và xoá dữ liệu" (Nghị định 13):
//   { "event": "user.revoke.consent", "appId": "…", "userId": "<Zalo id>", "timestamp": 1670553442564 }
// The account linked to that Zalo id (zalo_links, written at every Zalo sign-in) gets an account-deletion request, which the admin
// carries out within 7 days as the privacy policy says. Every event is logged in zalo_revokes. Other events are acknowledged and ignored.
const APP_ID = Deno.env.get("ZALO_APP_ID") ?? "2847107362388346804";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Zalo's generateSignature(data, apiKey), ported as written in their docs. */
export async function zaloSignature(data: Record<string, unknown>, apiKey: string): Promise<string> {
  let content = "";
  for (const k of Object.keys(data).sort()) {
    let value: unknown = data[k];
    if (typeof value === "object") value = JSON.stringify(value);
    content += value;
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${content}${apiKey}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameText(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const apiKey = Deno.env.get("ZALO_API_KEY");
  if (!apiKey) return json({ error: "NOT_CONFIGURED" }, 503);

  let data: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "BAD_REQUEST" }, 400);
    data = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "BAD_REQUEST" }, 400);
  }

  const given = (req.headers.get("x-zevent-signature") ?? "").trim().toLowerCase();
  if (!given || !sameText(given, await zaloSignature(data, apiKey))) return json({ error: "BAD_SIGNATURE" }, 401);
  if (String(data.appId ?? "") !== APP_ID) return json({ error: "WRONG_APP" }, 403);
  if (data.event !== "user.revoke.consent") return json({ ok: true, ignored: true });

  const zaloId = typeof data.userId === "string" ? data.userId.trim().slice(0, 64) : "";
  if (!zaloId) return json({ error: "BAD_REQUEST" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: link, error: linkErr } = await admin.from("zalo_links").select("user_id").eq("zalo_id", zaloId).maybeSingle();
  if (linkErr) return json({ error: "FAILED" }, 500); // Zalo will retry

  let outcome: "request_created" | "request_open" | "no_account" = "no_account";
  if (link) {
    const { error } = await admin.from("deletion_requests").insert({ user_id: link.user_id, reason: "Zalo: người dùng rút lại sự đồng ý và yêu cầu xoá dữ liệu (user.revoke.consent)" });
    if (!error) outcome = "request_created";
    else if (error.code === "23505") outcome = "request_open"; // a request for this account is already open
    else return json({ error: "FAILED" }, 500);
  }
  await admin.from("zalo_revokes").insert({ zalo_id: zaloId, user_id: link?.user_id ?? null, outcome });
  return json({ ok: true });
});
