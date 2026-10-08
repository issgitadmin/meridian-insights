"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { ShareButton } from "@/components/ShareDialog";
import { loadDataset, type Dataset } from "@/lib/store";

export default function InsightsPage() {
  const [ds, setDs] = useState<Dataset | null | undefined>(undefined);

  useEffect(() => setDs(loadDataset()), []);

  return (
    <>
      <Navbar title="Insights" actions={ds ? <ShareButton name={ds.name} deals={ds.deals} /> : undefined} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {ds === undefined ? null : ds ? (
          <Dashboard deals={ds.deals} />
        ) : (
          <div className="mx-auto mt-10 max-w-md rounded-4xl border border-ink-700/70 bg-ink-850 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-ink-700 bg-ink-800 text-fg-muted">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-medium">No data loaded yet</h2>
            <p className="mt-2 text-sm text-fg-subtle">Upload a sales CSV to see revenue, rep and customer insights.</p>
            <Link
              href="/upload"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-fg px-6 font-medium text-ink-950 hover:bg-white"
            >
              Upload data
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
