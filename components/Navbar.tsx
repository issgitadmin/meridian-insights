"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Upload, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/insights", label: "Insights", icon: LayoutGrid },
];

export function Navbar({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/upload" className="flex items-center gap-2.5" aria-label="Meridian home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-fg text-ink-950">
            <Logo className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-semibold tracking-wide text-fg sm:inline">MERIDIAN</span>
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-xl font-medium tracking-tight sm:text-2xl">{title}</h1>

        <nav aria-label="Main" className="order-last flex w-full items-center gap-1 rounded-full border border-ink-700 bg-ink-850 p-1 sm:order-none sm:w-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm transition sm:flex-none ${
                  active ? "bg-fg font-medium text-ink-950" : "text-fg-muted hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={signOut}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-700 bg-ink-850 text-fg-muted transition hover:text-fg"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
