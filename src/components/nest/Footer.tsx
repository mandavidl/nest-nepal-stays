import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-sand bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-cream">
            <span className="font-display text-base font-semibold leading-none">N</span>
          </span>
          <p className="text-[13px] text-stone2">
            NestNepal — verified stays across Nepal. Prices in NPR, no hidden fees.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[13px] font-semibold text-stone2">
          <Link to="/explore" className="hover:text-ink">
            Explore
          </Link>
          <Link to="/become-a-host" className="hover:text-ink">
            Become a Host
          </Link>
          <Link to="/host" className="hover:text-ink">
            Host dashboard
          </Link>
          <Link to="/about" className="hover:text-ink">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
