import "server-only";
import { createClient } from "@supabase/supabase-js";
import { normalizeDeal, type Deal } from "@/lib/deals";

// Server-only client. The snapshots table has RLS on with no policies, so the
// publishable key can only reach it through the create/get RPC functions.
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Snapshot = { id: string; name: string; rowCount: number; createdAt: string; deals: Deal[] };

export async function createSnapshot(name: string, deals: Deal[]) {
  const { data, error } = await client().rpc("create_snapshot", { p_name: name, p_deals: deals });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await client().rpc("get_snapshot", { p_id: id });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    rowCount: row.row_count,
    createdAt: row.created_at,
    deals: (row.deals as Record<string, unknown>[]).map(normalizeDeal),
  };
}
