import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nest/Shell";
import { Panel, primaryButtonClass } from "@/components/nest/Bits";
import { categories } from "@/lib/nest-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About NestNepal — Organised Stays, Honest Prices" },
      {
        name: "description",
        content:
          "NestNepal keeps accommodation types clearly separated, verifies every listing and host, and shows the complete price before you book.",
      },
      { property: "og:title", content: "About NestNepal" },
      {
        property: "og:description",
        content: "Organised categories, verified listings and transparent NPR pricing.",
      },
    ],
  }),
  component: About,
});

const principles = [
  ["Clear categories", "Homes, hotels, rooms, homestays and cottages never get mixed into one list."],
  ["Location-first search", "Search by town or neighbourhood, then narrow by what you actually need."],
  ["Accurate information", "Bedrooms, beds, bathrooms and capacity are shown on every listing."],
  ["Transparent pricing", "Cleaning and service fees appear before you confirm, in NPR."],
  ["Verified listings", "Property, host, photos and stay checks are shown as badges."],
  ["Reviews you can trust", "Only guests who completed a stay can leave a review."],
];

function About() {
  return (
    <Shell>
      <section className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Nepal's stays, finally organised.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone2 sm:text-base">
          NestNepal is a marketplace for places to stay in Nepal, and nothing else. Every listing
          belongs to one clear accommodation type, is checked before it goes live, and shows its
          complete price in Nepali rupees before you confirm.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {principles.map(([title, body]) => (
            <Panel key={title}>
              <p className="font-display text-base font-semibold">{title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-stone2">{body}</p>
            </Panel>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            The five categories
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/explore"
                search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: c.id }}
                className="rounded-2xl border border-sand bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
              >
                <p className="font-semibold">
                  {c.emoji} {c.label}
                </p>
                <p className="mt-1 text-[13px] text-stone2">{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Link
            to="/explore"
            search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
            className={primaryButtonClass}
          >
            Start exploring
          </Link>
        </div>
      </section>
    </Shell>
  );
}
