import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

const tabs = [
  { to: "/", label: "Home", glyph: "⌂", exact: true },
  { to: "/explore", label: "Explore", glyph: "◎", exact: false },
  { to: "/account", label: "Saved", glyph: "♥", exact: false },
  { to: "/host", label: "Host", glyph: "◈", exact: false },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main className="nn-fade-in">{children}</main>
      <Footer />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2.5 pb-3">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "text-brand-deep" }}
              inactiveProps={{ className: "text-stone2" }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-base font-bold">{t.glyph}</span>
              <span className="text-[10px] font-semibold">{t.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
