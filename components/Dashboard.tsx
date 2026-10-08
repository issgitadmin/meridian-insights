"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, Segmented } from "@/components/Card";
import { BarList, RevenueChart, StageDonut, VIZ } from "@/components/charts";
import { DealsTable, RepTable } from "@/components/tables";
import {
  cycleByProduct,
  fmtMoney,
  fmtPct,
  pipelineByStage,
  repPerformance,
  revenueOverTime,
  summarize,
  takeaways,
  winRateBySource,
  type Deal,
  type Granularity,
} from "@/lib/deals";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-full border border-ink-700 bg-ink-850 pl-4 pr-2 text-sm">
      <span className="text-fg-subtle">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent pr-1 text-fg outline-none [&>option]:bg-ink-800"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-ink-700/70 bg-ink-850 px-5 py-4">
      <p className="text-sm text-fg-subtle">{label}</p>
      <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums sm:text-[28px]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-fg-subtle">{sub}</p>}
    </div>
  );
}

export function Dashboard({ deals }: { deals: Deal[] }) {
  const [product, setProduct] = useState("");
  const [industry, setIndustry] = useState("");
  const [rep, setRep] = useState("");
  const [gran, setGran] = useState<Granularity>("month");

  const options = useMemo(
    () => ({
      products: [...new Set(deals.map((d) => d.product_line))].sort(),
      industries: [...new Set(deals.map((d) => d.industry))].sort(),
      reps: [...new Set(deals.map((d) => d.rep_name))].sort(),
    }),
    [deals],
  );

  const view = useMemo(
    () =>
      deals.filter(
        (d) => (!product || d.product_line === product) && (!industry || d.industry === industry) && (!rep || d.rep_name === rep),
      ),
    [deals, product, industry, rep],
  );

  const s = useMemo(() => summarize(view), [view]);
  const revenue = useMemo(() => revenueOverTime(view, gran), [view, gran]);
  const reps = useMemo(() => repPerformance(view), [view]);
  const stages = useMemo(() => pipelineByStage(view), [view]);
  const cycles = useMemo(() => cycleByProduct(view), [view]);
  const sources = useMemo(() => winRateBySource(view), [view]);
  const notes = useMemo(() => takeaways(view), [view]);
  const filtered = product || industry || rep;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Product" value={product} options={options.products} onChange={setProduct} />
        <FilterSelect label="Industry" value={industry} options={options.industries} onChange={setIndustry} />
        <FilterSelect label="Rep" value={rep} options={options.reps} onChange={setRep} />
        {filtered && (
          <button
            onClick={() => {
              setProduct("");
              setIndustry("");
              setRep("");
            }}
            className="h-10 rounded-full px-3 text-sm text-fg-muted hover:text-fg"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-fg-subtle">
          {view.length.toLocaleString()} of {deals.length.toLocaleString()} deals
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Won revenue" value={fmtMoney(s.wonRevenue, true)} sub={`${s.wonCount} deals closed won`} />
        <Stat label="Win rate" value={fmtPct(s.winRate)} sub={`${s.wonCount} won · ${s.lostCount} lost`} />
        <Stat label="Avg days to close" value={s.wonCount ? String(Math.round(s.avgCycle)) : "—"} sub={`Median ${Math.round(s.medianCycle)} days`} />
        <Stat label="Open pipeline" value={fmtMoney(s.openPipeline, true)} sub={`${fmtMoney(s.weightedPipeline, true)} weighted · ${s.openCount} deals`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Revenue over time"
          subtitle="Closed-won deal value by close date"
          action={
            <Segmented
              label="Time bucket"
              value={gran}
              onChange={setGran}
              options={[
                { value: "month", label: "Monthly" },
                { value: "quarter", label: "Quarterly" },
              ]}
            />
          }
        >
          {revenue.length ? (
            <>
              <p className="-mt-1 mb-4 text-4xl font-medium tracking-tight tabular-nums">{fmtMoney(s.wonRevenue)}</p>
              <RevenueChart data={revenue} />
            </>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Pipeline by stage" subtitle="Open deals, by value">
          {stages.length ? <StageDonut data={stages} total={s.openPipeline} /> : <Empty text="No open deals." />}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Rep performance" subtitle="Sorted by closed-won revenue. Click a column to re-sort.">
          {reps.length ? <RepTable rows={reps} /> : <Empty />}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
              Summary
            </span>
          }
          subtitle="Calculated from the data shown"
        >
          {notes.length ? (
            <ul className="space-y-3.5 text-sm leading-relaxed text-fg-muted">
              {notes.map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" aria-hidden="true" />
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Time to close by product" subtitle="Average days from created to closed won">
          {cycles.length ? (
            <BarList
              rows={cycles.map((c) => ({ label: c.product, value: c.avg }))}
              format={(v) => `${Math.round(v)} days`}
              color={VIZ[0]}
              detail={(i) => `Median ${Math.round(cycles[i].median)} days · ${cycles[i].count} won deals`}
            />
          ) : (
            <Empty />
          )}
        </Card>
        <Card title="Win rate by lead source" subtitle="Share of closed deals that were won">
          {sources.length ? (
            <BarList
              rows={sources.map((x) => ({ label: x.source, value: x.winRate }))}
              format={fmtPct}
              color={VIZ[0]}
              detail={(i) => `${sources[i].won} of ${sources[i].closed} won · ${fmtMoney(sources[i].revenue, true)}`}
            />
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <Card title="Customers" subtitle="Every deal, with how long it took to close">
        <DealsTable deals={view} />
      </Card>
    </div>
  );
}

function Empty({ text = "No data for these filters." }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-fg-subtle">{text}</p>;
}
