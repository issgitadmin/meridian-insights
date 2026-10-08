import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-medium">Snapshot not found</h1>
        <p className="mt-2 text-sm text-fg-subtle">This link may be mistyped, or the snapshot was removed.</p>
        <Link href="/upload" className="mt-6 inline-flex h-11 items-center rounded-full bg-fg px-6 font-medium text-ink-950">
          Go to Meridian
        </Link>
      </div>
    </main>
  );
}
