"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { REQUIRED_COLUMNS, fmtDate, fmtMoney, parseDealsCsv, summarize, type Deal } from "@/lib/deals";
import { loadDataset, saveDataset, clearDataset } from "@/lib/store";

type Loaded = { name: string; deals: Deal[]; skipped: number };

export default function UploadPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const ds = loadDataset();
    if (ds) setLoaded({ name: ds.name, deals: ds.deals, skipped: 0 });
  }, []);

  function accept(name: string, text: string) {
    const result = parseDealsCsv(text);
    if (!result.ok) {
      setError(result.error);
      setLoaded(null);
      return;
    }
    setError("");
    const ds = { name: name.replace(/\.csv$/i, ""), deals: result.deals, loadedAt: new Date().toISOString() };
    if (!saveDataset(ds)) {
      setError("This browser blocked local storage, so the data can't be kept between pages.");
      return;
    }
    setLoaded({ name: ds.name, deals: result.deals, skipped: result.skipped });
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Please choose a .csv file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is larger than 10 MB.");
      return;
    }
    accept(file.name, await file.text());
  }

  async function useSample() {
    const res = await fetch("/sample-meridian-sales.csv");
    accept("meridian_sales.csv", await res.text());
  }

  const stats = loaded ? summarize(loaded.deals) : null;
  const range = loaded
    ? loaded.deals.reduce(
        (r, d) => ({
          from: d.created_date < r.from ? d.created_date : r.from,
          to: d.close_date > r.to ? d.close_date : r.to,
        }),
        { from: "9999-12-31", to: "0000-01-01" },
      )
    : null;

  return (
    <>
      <Navbar title="Upload data" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            readFile(e.dataTransfer.files[0]);
          }}
          className={`rounded-4xl border bg-ink-850 p-6 transition sm:p-10 ${
            drag ? "border-accent bg-accent/5" : "border-ink-700/70"
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-ink-700 bg-ink-800 text-fg-muted">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-medium tracking-tight">Upload a sales CSV</h2>
            <p className="mt-2 max-w-md text-sm text-fg-subtle">
              Drag a file here or browse. It needs the same columns as the Meridian deals export. The data stays in this
              browser until you share it.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => input.current?.click()}
                className="flex h-11 items-center gap-2 rounded-full bg-fg px-6 font-medium text-ink-950 transition hover:bg-white"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Choose CSV
              </button>
              <button
                onClick={useSample}
                className="h-11 rounded-full border border-ink-700 bg-ink-800 px-5 text-sm text-fg-muted transition hover:text-fg"
              >
                Use sample data
              </button>
            </div>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <div role="alert" className="mt-8 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {error}
            </div>
          )}

          {loaded && stats && range && (
            <div className="mt-8 rounded-3xl border border-ink-700 bg-ink-800/60 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{loaded.name}</p>
                  <p className="text-sm text-fg-subtle">
                    {stats.total.toLocaleString()} deals · {fmtDate(range.from)} – {fmtDate(range.to)}
                    {loaded.skipped > 0 && ` · ${loaded.skipped} rows skipped (missing dates or values)`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    clearDataset();
                    setLoaded(null);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-fg-subtle hover:bg-ink-700 hover:text-fg"
                  aria-label="Remove dataset"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Won revenue", fmtMoney(stats.wonRevenue, true)],
                  ["Won deals", stats.wonCount.toLocaleString()],
                  ["Open deals", stats.openCount.toLocaleString()],
                  ["Reps", new Set(loaded.deals.map((d) => d.rep_name)).size.toString()],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-ink-850 px-4 py-3">
                    <dt className="text-xs text-fg-subtle">{k}</dt>
                    <dd className="mt-1 text-lg font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => router.push("/insights")}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-fg font-medium text-ink-950 transition hover:bg-white"
              >
                View insights
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <details className="mt-6 rounded-3xl border border-ink-700/70 bg-ink-850 px-5 py-4 text-sm text-fg-muted">
          <summary className="cursor-pointer select-none text-fg">Expected columns</summary>
          <p className="mt-3 font-mono text-xs leading-6 text-fg-subtle">{REQUIRED_COLUMNS.join(", ")}</p>
        </details>
      </main>
    </>
  );
}
