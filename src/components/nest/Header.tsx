import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNest } from "@/lib/nest-store";

const links = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/become-a-host", label: "Become a Host" },
  { to: "/about", label: "About" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { account, favorites } = useNest();

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-cream shadow-sm">
            <span className="font-display text-lg font-semibold leading-none">N</span>
          </span>
          <span className="truncate font-display text-lg font-semibold tracking-tight">
            NestNepal
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-brand-deep" }}
              inactiveProps={{ className: "text-stone2 hover:text-ink" }}
              className="rounded-full px-3 py-2 text-sm font-semibold transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/account"
            className="ml-1 rounded-full px-3 py-2 text-sm font-semibold text-stone2 transition-colors hover:text-ink"
          >
            Saved{favorites.length ? ` (${favorites.length})` : ""}
          </Link>
          {account.signedIn ? (
            <Link
              to="/account"
              className="ml-2 rounded-full border border-sand bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-brand/40"
            >
              {account.name.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="ml-2 rounded-full border border-sand bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-brand/40"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brand-deep"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink/70 transition-colors hover:bg-sand lg:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-5">
            <span className="absolute top-0 h-0.5 w-full rounded bg-current" />
            <span className="absolute top-1.5 h-0.5 w-full rounded bg-current" />
            <span className="absolute top-3 h-0.5 w-full rounded bg-current" />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-sand bg-cream px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand"
            >
              My account
            </Link>
            <Link
              to="/host"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand"
            >
              Host dashboard
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-sand bg-surface py-2.5 text-center text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-ink py-2.5 text-center text-sm font-semibold text-cream"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
