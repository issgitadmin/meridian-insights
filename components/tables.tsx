"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Pill, Segmented } from "@/components/Card";
import { VIZ } from "@/components/charts";
import {
  cycleDays,
  fmtDate,
  fmtMoney,
  fmtPct,
  isClosed,
  isLost,
  isWon,
  type Deal,
  type RepRow,
} from "@/lib/deals";

type SortState<K extends string> = { key: K; dir: "asc" | "desc" };

function useSort<T, K extends string>(rows: T[], initial: SortState<K>, get: (row: T, key: K) => string | number) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => {
      const x = get(a, sort.key);
      const y = get(b, sort.key);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? c : -c;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key: K) =>
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : typeof get(rows[0], key) === "number" ? "desc" : "asc" }));
  return { sorted, sort, toggle };
}

function Th<K extends string>({
  k,
  sort,
  toggle,
  children,
  right,
}: {
  k: K;
  sort: SortState<K>;
  toggle: (k: K) => void;
  children: React.ReactNode;
  right?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap px-3 py-2.5 font-normal ${right ? "text-right" : "text-left"}`}
    >
      <button
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1 transition hover:text-fg ${active ? "text-fg" : ""}`}
      >
        {children}
        {active && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

// ---------- reps ----------

type RepKey = "rep" | "wonRevenue" | "won" | "winRate" | "avgCycle" | "pipeline";

export function RepTable({ rows }: { rows: RepRow[] }) {
  const { sorted, sort, toggle } = useSort<RepRow, RepKey>(rows, { key: "wonRevenue", dir: "desc" }, (r, k) => r[k]);
  const max = Math.max(...rows.map((r) => r.wonRevenue), 1);

  return (
    <div className="scrollbar-thin -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-ink-700 text-xs text-fg-subtle">
          <tr>
            <Th k="rep" sort={sort} toggle={toggle}>Rep</Th>
            <Th k="wonRevenue" sort={sort} toggle={toggle}>Won revenue</Th>
            <Th k="won" sort={sort} toggle={toggle} right>Won / lost</Th>
            <Th k="winRate" sort={sort} toggle={toggle} right>Win rate</Th>
            <Th k="avgCycle" sort={sort} toggle={toggle} right>Avg days to close</Th>
            <Th k="pipeline" sort={sort} toggle={toggle} right>Open pipeline</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.rep} className="border-b border-ink-700/50 last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 text-fg">{r.rep}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 shrink-0 rounded-full bg-ink-800">
                    <div className="h-1.5 rounded-full" style={{ width: `${(r.wonRevenue / max) * 100}%`, background: VIZ[0] }} />
                  </div>
                  <span className="tabular-nums">{fmtMoney(r.wonRevenue, true)}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">
                {r.won} / {r.lost}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.won + r.lost ? fmtPct(r.winRate) : "—"}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.won ? Math.round(r.avgCycle) : "—"}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{fmtMoney(r.pipeline, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- customers / deals ----------

type DealKey = "company_name" | "rep_name" | "product_line" | "deal_stage" | "deal_value" | "created_date" | "close_date" | "cycle";
type StatusFilter = "all" | "won" | "lost" | "open";

const PAGE = 12;

function StagePill({ d }: { d: Deal }) {
  if (isWon(d)) return <Pill tone="good">Won</Pill>;
  if (isLost(d)) return <Pill tone="bad">Lost</Pill>;
  return <Pill tone="info">{d.deal_stage}</Pill>;
}

export function DealsTable({ deals }: { deals: Deal[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return deals.filter((d) => {
      if (status === "won" && !isWon(d)) return false;
      if (status === "lost" && !isLost(d)) return false;
      if (status === "open" && isClosed(d)) return false;
      if (!needle) return true;
      return [d.company_name, d.rep_name, d.industry, d.product_line, d.deal_id].some((s) => s.toLowerCase().includes(needle));
    });
  }, [deals, q, status]);

  const { sorted, sort, toggle } = useSort<Deal, DealKey>(filtered, { key: "close_date", dir: "desc" }, (d, k) =>
    k === "cycle" ? cycleDays(d) : d[k],
  );

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = sorted.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 focus-within:border-fg-subtle sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search customers, reps…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
            aria-label="Search deals"
          />
        </label>
        <Segmented
          label="Deal status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "won", label: "Won" },
            { value: "lost", label: "Lost" },
            { value: "open", label: "Open" },
          ]}
        />
      </div>

      <div className="scrollbar-thin -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-ink-700 text-xs text-fg-subtle">
            <tr>
              <Th k="company_name" sort={sort} toggle={toggle}>Customer</Th>
              <Th k="rep_name" sort={sort} toggle={toggle}>Rep</Th>
              <Th k="product_line" sort={sort} toggle={toggle}>Product</Th>
              <Th k="deal_stage" sort={sort} toggle={toggle}>Stage</Th>
              <Th k="deal_value" sort={sort} toggle={toggle} right>Value</Th>
              <Th k="created_date" sort={sort} toggle={toggle} right>Created</Th>
              <Th k="close_date" sort={sort} toggle={toggle} right>Close</Th>
              <Th k="cycle" sort={sort} toggle={toggle} right>Days to close</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.deal_id} className="border-b border-ink-700/50 last:border-0">
                <td className="px-3 py-2.5">
                  <p className="text-fg">{d.company_name}</p>
                  <p className="text-xs text-fg-subtle">{d.industry}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-fg-muted">{d.rep_name}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-fg-muted">{d.product_line.replace("Meridian ", "")}</td>
                <td className="px-3 py-2.5">
                  <StagePill d={d} />
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(d.deal_value)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-fg-muted">{fmtDate(d.created_date)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-fg-muted">
                  {fmtDate(d.close_date)}
                  {!isClosed(d) && <span className="block text-xs text-fg-subtle">expected</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {cycleDays(d)}
                  {!isClosed(d) && <span className="block text-xs text-fg-subtle">projected</span>}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-fg-subtle">
                  No deals match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-fg-subtle">
        <span>
          {sorted.length ? `${current * PAGE + 1}–${Math.min(sorted.length, (current + 1) * PAGE)} of ${sorted.length}` : "0 deals"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink-700 bg-ink-800 transition hover:text-fg disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(current + 1)}
            disabled={current >= pages - 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink-700 bg-ink-800 transition hover:text-fg disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
