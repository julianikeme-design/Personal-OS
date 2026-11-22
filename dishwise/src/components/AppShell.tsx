"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { track } from "@/lib/client/analytics";
import { getMeta, setMeta } from "@/lib/client/store";
import { IconBook, IconCompass, IconPassport, IconScan, IconUser } from "./icons";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Discover", Icon: IconCompass },
  { href: "/passport", label: "Passport", Icon: IconPassport },
  { href: "/scan", label: "Scan", Icon: IconScan, primary: true },
  { href: "/journal", label: "Journal", Icon: IconBook },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

const HIDE_NAV = [/^\/onboarding/, /^\/enjoy/, /^\/founder/, /^\/how-it-works/];

function VisitTracker() {
  const params = useSearchParams();
  useEffect(() => {
    const meta = getMeta();
    const invite = params.get("invite") ?? params.get("ref");
    if (invite && !meta.invite) setMeta({ invite: invite.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) });
    const today = new Date().toISOString().slice(0, 10);
    if (meta.lastVisitDay !== today) {
      setMeta({ lastVisitDay: today });
      track("visit", { returning: meta.lastVisitDay !== null });
    }
  }, [params]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const hideNav = HIDE_NAV.some((r) => r.test(path));
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <Suspense fallback={null}>
        <VisitTracker />
      </Suspense>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <main id="main" className={cx("mx-auto w-full max-w-xl px-5", hideNav ? "pb-10" : "pb-32")}>
        {children}
      </main>
      {!hideNav && (
        <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
          <ul className="mx-auto flex max-w-xl items-end justify-between px-3 pt-1.5 pb-2">
            {NAV.map(({ href, label, Icon, primary }) => {
              const active = isActive(href);
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cx("flex flex-col items-center gap-1 text-[11px] font-medium", active ? "text-ink" : "text-faint hover:text-muted")}
                  >
                    {primary ? (
                      <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-card ring-4 ring-bg">
                        <Icon size={24} />
                      </span>
                    ) : (
                      <Icon size={22} strokeWidth={active ? 2.1 : 1.75} />
                    )}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
