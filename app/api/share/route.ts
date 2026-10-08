import { NextResponse } from "next/server";
import { createSnapshot } from "@/lib/supabase";
import { REQUIRED_COLUMNS, normalizeDeal } from "@/lib/deals";

const MAX_ROWS = 20_000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const rows = body?.deals;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No deals to share." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Snapshots are limited to ${MAX_ROWS.toLocaleString()} rows.` }, { status: 413 });
  }
  if (!rows.every((r) => r && typeof r === "object" && REQUIRED_COLUMNS.every((c) => c in r))) {
    return NextResponse.json({ error: "Deals are not in the expected format." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.slice(0, 200) : "Untitled snapshot";
  try {
    const id = await createSnapshot(name, rows.map(normalizeDeal));
    return NextResponse.json({ id, path: `/share/${id}` });
  } catch (e) {
    console.error("share failed", e);
    return NextResponse.json({ error: "Could not save the snapshot. Try again." }, { status: 500 });
  }
}
