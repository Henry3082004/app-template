import { createClient } from "jsr:@supabase/supabase-js@2";

// Hourly copy of DAILY TOTALS into the owner's private Google Sheet (pg_cron calls this; see 20261117_accounting_feed.sql).
//   · tab "Metrics": one row per day — new shops, new workers, finished shifts, fee at list price, voucher discount, fee due
//   · tab "Journal": a finished shift that owes a fee becomes one balanced entry per day (Dr 1100 receivable / Cr 4000 service fee revenue),
//     id AUTO-YYYY-MM-DD, added once and never changed. Money RECEIVED is typed into the Journal by hand (payments are off).
// Only totals leave the database: no names, phones or e-mails. Auth: the key in the vault (header x-sync-key), not a user token.
// Needs the Edge Function secret GOOGLE_SA_JSON (a Google service account key, added in the Supabase dashboard — never in code or chat)
// and the sheet shared with that service account's e-mail as Editor. Without the secret it answers NOT_CONFIGURED and does nothing.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const b64url = (b: ArrayBuffer | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = ""; for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
function sameKey(a: string, b: string) { // compares every character so the time taken does not hint at the key
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function googleToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }),
  });
  const t = await r.json().catch(() => ({}));
  if (!t?.access_token) throw new Error("GOOGLE_AUTH");
  return t.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "BAD_REQUEST" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "SYNC_FAILED" }, 500);
  const admin = createClient(url, service, { auth: { persistSession: false } });

  const sent = req.headers.get("x-sync-key") ?? "";
  const { data: key } = await admin.rpc("acct_sync_key");
  if (!sent || typeof key !== "string" || !sameKey(sent, key)) return json({ error: "FORBIDDEN" }, 403);

  const saRaw = Deno.env.get("GOOGLE_SA_JSON");
  if (!saRaw) return json({ ok: false, error: "NOT_CONFIGURED" });
  let sa: { client_email: string; private_key: string };
  try { sa = JSON.parse(saRaw); if (!sa.client_email || !sa.private_key) throw 0; } catch { return json({ ok: false, error: "BAD_SERVICE_ACCOUNT" }); }

  const { data: setting } = await admin.from("app_settings").select("value").eq("key", "acct_sheet_id").maybeSingle();
  const sheetId = setting?.value;
  if (!sheetId) return json({ ok: false, error: "NO_SHEET" });
  const { data: days, error: dErr } = await admin.rpc("acct_daily", { p_days: 400 });
  if (dErr || !Array.isArray(days)) return json({ error: "SYNC_FAILED" }, 500);

  try {
    const token = await googleToken(sa);
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`;
    const call = async (path: string, init?: RequestInit) => {
      const r = await fetch(base + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (!r.ok) throw new Error(`SHEETS_${r.status}`);
      return r.json();
    };
    const post = (path: string, body: unknown) => call(path, { method: "POST", body: JSON.stringify(body) });

    // Metrics: replace the whole table (idempotent)
    const rows = days.map((d: Record<string, number | string>) => [d.day, d.shops, d.workers, d.shifts, d.fee, d.discount, d.due]);
    await post("/values/Metrics!A2:G1000:clear", {});
    await post("/values:batchUpdate", {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `Metrics!A2:G${rows.length + 1}`, values: rows },
        { range: "Metrics!I2", values: [[new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })]] },
      ],
    });

    // Journal: one entry per day that owes a fee, added once
    const j = await call("/values/Journal!A2:G500");
    const have: string[][] = j.values ?? [];
    const ids = new Set(have.map((r) => r[1]).filter(Boolean));
    const free: number[] = [];
    for (let i = 0; i < 499; i++) { const r = have[i] ?? []; if (!r[0] && !r[1] && !r[2]) free.push(i + 2); }
    const todo = days.filter((d: Record<string, number | string>) => Number(d.due) > 0 && !ids.has(`AUTO-${d.day}`));
    if (free.length < todo.length * 2) return json({ ok: false, error: "JOURNAL_FULL" });
    const data: { range: string; values: (string | number)[][] }[] = [];
    let k = 0;
    for (const d of todo) {
      const id = `AUTO-${d.day}`, desc = `Service fees due, finished shifts (auto ${d.day})`;
      for (const [code, dr, cr] of [[1100, d.due, ""], [4000, "", d.due]] as [number, number | string, number | string][]) {
        const r = free[k++];
        data.push({ range: `Journal!A${r}:C${r}`, values: [[String(d.day), id, code]] }, { range: `Journal!E${r}:G${r}`, values: [[desc, dr, cr]] });
      }
    }
    if (data.length) await post("/values:batchUpdate", { valueInputOption: "USER_ENTERED", data });
    return json({ ok: true, days: days.length, new_entries: todo.length });
  } catch (e) {
    console.log("accounting-sync failed", e instanceof Error ? e.message : "unknown"); // the code only, never the key or the data
    return json({ error: "SYNC_FAILED" }, 502);
  }
});
