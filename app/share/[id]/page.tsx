import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { CopyLinkButton } from "./CopyLinkButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const snap = await getSnapshot((await params).id).catch(() => null);
  return { title: snap ? `${snap.name} · Meridian Insights` : "Snapshot not found · Meridian Insights" };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const snap = await getSnapshot((await params).id);
  if (!snap) notFound();

  const created = new Date(snap.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <Navbar title={snap.name} actions={<CopyLinkButton />} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-3.5 py-1.5 text-xs text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Shared snapshot · {snap.rowCount.toLocaleString()} deals · saved {created}
        </p>
        <Dashboard deals={snap.deals} />
      </main>
    </>
  );
}
