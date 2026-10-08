import Papa from "papaparse";

export const REQUIRED_COLUMNS = [
  "deal_id",
  "company_name",
  "industry",
  "rep_name",
  "lead_source",
  "product_line",
  "deal_stage",
  "deal_value",
  "created_date",
  "close_date",
  "days_in_stage",
  "last_activity_days_ago",
  "probability_pct",
  "competitor_mentioned",
  "num_stakeholders",
  "next_action",
] as const;

export type Deal = {
  deal_id: string;
  company_name: string;
  industry: string;
  rep_name: string;
  lead_source: string;
  product_line: string;
  deal_stage: string;
  deal_value: number;
  created_date: string; // ISO yyyy-mm-dd
  close_date: string; // ISO yyyy-mm-dd
  days_in_stage: number;
  last_activity_days_ago: number;
  probability_pct: number;
  competitor_mentioned: string;
  num_stakeholders: number;
  next_action: string;
};

export type ParseResult =
  | { ok: true; deals: Deal[]; skipped: number }
  | { ok: false; error: string };

export const OPEN_STAGES = ["Prospecting", "Qualified", "Demo Scheduled", "Proposal Sent", "Negotiation"];

/** Accepts M/D/YYYY (as exported) or YYYY-MM-DD; returns YYYY-MM-DD or null. */
export function toIsoDate(raw: string): string | null {
  const s = raw.trim();
  let y: number, m: number, d: number;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (us) {
    m = +us[1];
    d = +us[2];
    y = +us[3] < 100 ? 2000 + +us[3] : +us[3];
  } else if (iso) {
    y = +iso[1];
    m = +iso[2];
    d = +iso[3];
  } else {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const num = (v: string) => {
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

export function parseDealsCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) {
    return {
      ok: false,
      error: `This file is missing ${missing.length === 1 ? "a column" : "columns"}: ${missing.join(", ")}.`,
    };
  }

  const deals: Deal[] = [];
  let skipped = 0;
  for (const row of parsed.data) {
    const created = toIsoDate(row.created_date ?? "");
    const closed = toIsoDate(row.close_date ?? "");
    const value = num(row.deal_value);
    if (!row.deal_id?.trim() || !created || !closed || Number.isNaN(value)) {
      skipped++;
      continue;
    }
    deals.push(normalizeDeal({ ...row, created_date: created, close_date: closed, deal_value: value }));
  }

  if (!deals.length) return { ok: false, error: "No valid deal rows were found in this file." };
  return { ok: true, deals, skipped };
}

/** Coerces any loosely typed record (CSV row or stored JSON) into a Deal. */
export function normalizeDeal(r: Record<string, unknown>): Deal {
  const s = (k: string) => String(r[k] ?? "").trim();
  const n = (k: string) => {
    const v = num(String(r[k] ?? ""));
    return Number.isNaN(v) ? 0 : v;
  };
  return {
    deal_id: s("deal_id"),
    company_name: s("company_name"),
    industry: s("industry"),
    rep_name: s("rep_name"),
    lead_source: s("lead_source"),
    product_line: s("product_line"),
    deal_stage: s("deal_stage"),
    deal_value: n("deal_value"),
    created_date: s("created_date"),
    close_date: s("close_date"),
    days_in_stage: n("days_in_stage"),
    last_activity_days_ago: n("last_activity_days_ago"),
    probability_pct: n("probability_pct"),
    competitor_mentioned: s("competitor_mentioned"),
    num_stakeholders: n("num_stakeholders"),
    next_action: s("next_action"),
  };
}

// ---------- metrics ----------

const DAY = 86_400_000;
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY);

export const isWon = (d: Deal) => d.deal_stage === "Closed Won";
export const isLost = (d: Deal) => d.deal_stage === "Closed Lost";
export const isClosed = (d: Deal) => isWon(d) || isLost(d);
export const cycleDays = (d: Deal) => daysBetween(d.created_date, d.close_date);

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function summarize(deals: Deal[]) {
  const won = deals.filter(isWon);
  const lost = deals.filter(isLost);
  const open = deals.filter((d) => !isClosed(d));
  const closedCount = won.length + lost.length;
  return {
    total: deals.length,
    wonRevenue: sum(won.map((d) => d.deal_value)),
    wonCount: won.length,
    lostCount: lost.length,
    openCount: open.length,
    winRate: closedCount ? won.length / closedCount : 0,
    avgDealSize: avg(won.map((d) => d.deal_value)),
    avgCycle: avg(won.map(cycleDays)),
    medianCycle: median(won.map(cycleDays)),
    openPipeline: sum(open.map((d) => d.deal_value)),
    weightedPipeline: sum(open.map((d) => (d.deal_value * d.probability_pct) / 100)),
  };
}

export type Granularity = "month" | "quarter";

/** Closed-won revenue bucketed by close date, with empty buckets filled in. */
export function revenueOverTime(deals: Deal[], g: Granularity) {
  const won = deals.filter(isWon);
  if (!won.length) return [];
  const key = (iso: string) => {
    const [y, m] = iso.split("-").map(Number);
    return g === "month" ? y * 12 + (m - 1) : y * 4 + Math.floor((m - 1) / 3);
  };
  const totals = new Map<number, { revenue: number; deals: number }>();
  for (const d of won) {
    const k = key(d.close_date);
    const t = totals.get(k) ?? { revenue: 0, deals: 0 };
    t.revenue += d.deal_value;
    t.deals += 1;
    totals.set(k, t);
  }
  const keys = [...totals.keys()];
  const lo = Math.min(...keys);
  const hi = Math.max(...keys);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const out = [];
  for (let k = lo; k <= hi; k++) {
    const label =
      g === "month"
        ? `${MONTHS[k % 12]} ’${String(Math.floor(k / 12)).slice(2)}`
        : `Q${(k % 4) + 1} ’${String(Math.floor(k / 4)).slice(2)}`;
    out.push({ label, ...(totals.get(k) ?? { revenue: 0, deals: 0 }) });
  }
  return out;
}

export type RepRow = {
  rep: string;
  wonRevenue: number;
  won: number;
  lost: number;
  open: number;
  winRate: number;
  avgCycle: number;
  pipeline: number;
};

export function repPerformance(deals: Deal[]): RepRow[] {
  const byRep = new Map<string, Deal[]>();
  for (const d of deals) byRep.set(d.rep_name, [...(byRep.get(d.rep_name) ?? []), d]);
  return [...byRep.entries()]
    .map(([rep, ds]) => {
      const won = ds.filter(isWon);
      const lost = ds.filter(isLost);
      const open = ds.filter((d) => !isClosed(d));
      return {
        rep,
        wonRevenue: sum(won.map((d) => d.deal_value)),
        won: won.length,
        lost: lost.length,
        open: open.length,
        winRate: won.length + lost.length ? won.length / (won.length + lost.length) : 0,
        avgCycle: avg(won.map(cycleDays)),
        pipeline: sum(open.map((d) => d.deal_value)),
      };
    })
    .sort((a, b) => b.wonRevenue - a.wonRevenue);
}

export function pipelineByStage(deals: Deal[]) {
  return OPEN_STAGES.map((stage) => {
    const ds = deals.filter((d) => d.deal_stage === stage);
    return { stage, value: sum(ds.map((d) => d.deal_value)), count: ds.length };
  }).filter((s) => s.count > 0);
}

export function cycleByProduct(deals: Deal[]) {
  const won = deals.filter(isWon);
  const products = [...new Set(won.map((d) => d.product_line))].sort();
  return products.map((p) => {
    const cycles = won.filter((d) => d.product_line === p).map(cycleDays);
    return { product: p, avg: avg(cycles), median: median(cycles), count: cycles.length };
  });
}

export function winRateBySource(deals: Deal[]) {
  const closed = deals.filter(isClosed);
  const sources = [...new Set(closed.map((d) => d.lead_source))];
  return sources
    .map((source) => {
      const ds = closed.filter((d) => d.lead_source === source);
      const won = ds.filter(isWon);
      return {
        source,
        winRate: ds.length ? won.length / ds.length : 0,
        won: won.length,
        closed: ds.length,
        revenue: sum(won.map((d) => d.deal_value)),
      };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

/** Plain-language takeaways computed from the data (no model involved). */
export function takeaways(deals: Deal[]): string[] {
  const s = summarize(deals);
  const reps = repPerformance(deals).filter((r) => r.won + r.lost >= 3);
  const sources = winRateBySource(deals).filter((x) => x.closed >= 5);
  const cycles = cycleByProduct(deals);
  const stalled = deals.filter((d) => !isClosed(d) && d.last_activity_days_ago >= 21);
  const out: string[] = [];

  if (reps.length) {
    const top = reps[0];
    out.push(`${top.rep} leads on closed revenue with ${fmtMoney(top.wonRevenue, true)} across ${top.won} won deals.`);
    const bestRate = [...reps].sort((a, b) => b.winRate - a.winRate)[0];
    if (bestRate.rep !== top.rep)
      out.push(`${bestRate.rep} has the highest win rate at ${fmtPct(bestRate.winRate)}.`);
  }
  if (sources.length >= 2) {
    const best = sources[0];
    const worst = sources[sources.length - 1];
    out.push(
      `${best.source} leads convert best (${fmtPct(best.winRate)}); ${worst.source} converts worst (${fmtPct(worst.winRate)}).`,
    );
  }
  if (cycles.length >= 2) {
    const slow = [...cycles].sort((a, b) => b.avg - a.avg)[0];
    const fast = [...cycles].sort((a, b) => a.avg - b.avg)[0];
    out.push(`${slow.product} deals take ${Math.round(slow.avg)} days to close on average, vs ${Math.round(fast.avg)} for ${fast.product}.`);
  }
  if (s.openCount) {
    out.push(
      `${s.openCount} open deals hold ${fmtMoney(s.openPipeline, true)} in pipeline (${fmtMoney(s.weightedPipeline, true)} probability-weighted).`,
    );
  }
  if (stalled.length) {
    out.push(`${stalled.length} open ${stalled.length === 1 ? "deal has" : "deals have"} had no activity in 3+ weeks.`);
  }
  return out;
}

// ---------- formatting ----------

export function fmtMoney(n: number, compact = false) {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
    if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  }
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export const fmtPct = (r: number) => `${Math.round(r * 100)}%`;

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
