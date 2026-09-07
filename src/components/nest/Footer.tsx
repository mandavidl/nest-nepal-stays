import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/nestnepal-logo.jpg.asset.json";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-sand bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt="NestNepal logo"
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
          <p className="text-[13px] text-stone2">
            NestNepal — verified stays across Nepal. Prices in NPR, no hidden fees.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-[13px] font-semibold text-stone2">
          <Link
            to="/explore"
            search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
            className="hover:text-ink"
          >
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
