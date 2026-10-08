"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney } from "@/lib/deals";

// Validated categorical order for the dark surface; assigned by entity, never cycled.
export const VIZ = ["#3987e5", "#d95926", "#199e70", "#c98500", "#8b6fe0"];
const MUTED_BAR = "#3a3a41";
const GRID = "#26262a";
const AXIS = "#71717a";
const SURFACE = "#141416";

function TipBox({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-fg">{title}</p>
      {rows.map(([k, v]) => (
        <p key={k} className="flex justify-between gap-6 text-fg-muted">
          <span>{k}</span>
          <span className="tabular-nums text-fg">{v}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: { label: string; revenue: number; deals: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = data.reduce((best, d, i) => (d.revenue > data[best].revenue ? i : best), 0);
  const active = hover ?? peak;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} onMouseLeave={() => setHover(null)}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS, fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: AXIS, fontSize: 12 }}
            tickFormatter={(v) => fmtMoney(v, true)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox
                  title={payload[0].payload.label}
                  rows={[
                    ["Won revenue", fmtMoney(payload[0].payload.revenue)],
                    ["Deals closed", String(payload[0].payload.deals)],
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} onMouseEnter={(_, i) => setHover(i)}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === active ? VIZ[0] : MUTED_BAR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageDonut({ data, total }: { data: { stage: string; value: number; count: number }[]; total: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover === null ? null : data[hover];
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="stage"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={6}
              stroke={SURFACE}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, i) => setHover(i)}
              onMouseLeave={() => setHover(null)}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.stage} fill={VIZ[i % VIZ.length]} opacity={hover === null || hover === i ? 1 : 0.35} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-medium tabular-nums">{fmtMoney(shown ? shown.value : total, true)}</p>
            <p className="text-xs text-fg-subtle">{shown ? `${shown.stage} · ${shown.count}` : "Open pipeline"}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d, i) => (
          <li
            key={d.stage}
            className="flex items-center gap-2.5"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: VIZ[i % VIZ.length] }} aria-hidden="true" />
            <span className="flex-1 text-fg-muted">{d.stage}</span>
            <span className="tabular-nums text-fg">{fmtMoney(d.value, true)}</span>
            <span className="w-8 text-right tabular-nums text-fg-subtle">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal single-series bars with direct value labels; doubles as its own table. */
export function BarList({
  rows,
  format,
  color = VIZ[0],
  detail,
}: {
  rows: { label: string; value: number }[];
  format: (v: number) => string;
  color?: string;
  detail?: (i: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.label} title={detail?.(i)}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-fg-muted">{r.label}</span>
            <span className="shrink-0 tabular-nums text-fg">{format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-800">
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
          {detail && <p className="mt-1 text-xs text-fg-subtle">{detail(i)}</p>}
        </li>
      ))}
    </ul>
  );
}
