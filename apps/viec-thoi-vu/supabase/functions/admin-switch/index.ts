import { createClient } from "jsr:@supabase/supabase-js@2";

// Lets an ADMIN open the app as one of the two SAMPLE accounts (a shop, a worker) to see what they see.
//   { mode: "employer" | "seeker" }  with the admin's own session token  →  { token_hash, email }   (the client exchanges it for a session)
// Only accounts flagged is_sample in the database can be opened (see demo_account()); a real customer's account is never returned.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "BAD_REQUEST" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "SWITCH_FAILED" }, 500);
  const admin = createClient(url, service, { auth: { persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "BAD_REQUEST" }, 400); }
  const mode = body.mode === "employer" ? "employer" : body.mode === "seeker" ? "seeker" : null;
  if (!mode) return json({ error: "BAD_REQUEST" }, 400);

  // who is asking: must be a signed-in admin (the anon key is not a user token)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  let uid: string | null = null;
  try { const { data } = await admin.auth.getUser(token); uid = data.user?.id ?? null; } catch { /* not a user token */ }
  if (!uid) return json({ error: "FORBIDDEN" }, 403);
  const { data: me } = await admin.from("profiles").select("is_admin, is_sample").eq("id", uid).maybeSingle();
  // a sample account is never an admin, so this also stops a demo session from switching again by itself
  if (!me?.is_admin || me.is_sample) return json({ error: "FORBIDDEN" }, 403);

  const { data: target, error: tErr } = await admin.rpc("demo_account", { p_kind: mode });
  if (tErr || !target) return json({ error: "NO_DEMO_ACCOUNT" }, 404);
  const { data: u } = await admin.auth.admin.getUserById(target as string);
  const email = u?.user?.email;
  if (!email) return json({ error: "NO_DEMO_ACCOUNT" }, 404);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) return json({ error: "SWITCH_FAILED" }, 500);
  console.log("admin-switch", uid, "->", mode); // a trace in the function logs: who opened which sample account
  return json({ ok: true, token_hash: data.properties.hashed_token, email });
});
