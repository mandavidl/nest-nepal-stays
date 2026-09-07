import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { SearchPanel, type SearchValues } from "@/components/nest/SearchPanel";
import { CategoryRail } from "@/components/nest/CategoryRail";
import { PropertyCard } from "@/components/nest/PropertyCard";
import { SectionHeading } from "@/components/nest/Bits";
import { categories, destinations, properties, type CategoryId } from "@/lib/nest-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NestNepal — Verified Stays & Rentals Across Nepal" },
      {
        name: "description",
        content:
          "Book verified homes, apartments, hotels, private rooms, homestays and cottages across Nepal. Clear categories, honest NPR pricing, no hidden fees.",
      },
      { property: "og:title", content: "NestNepal — Verified Stays Across Nepal" },
      {
        property: "og:description",
        content:
          "Find a place that feels like home: verified homes, hotels, rooms, homestays and cottages across Nepal.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [values, setValues] = useState<SearchValues>({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
  });

  const go = (category: CategoryId | "all" = "all") =>
    navigate({
      to: "/explore",
      search: {
        location: values.location,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: values.guests,
        category,
      },
    });

  const featured = properties.slice(0, 6);

  return (
    <Shell>
      <section className="relative overflow-hidden px-5 pt-8 pb-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent2/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-40 size-52 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-surface/70 px-3 py-1.5 text-xs font-semibold text-brand-deep">
            <span className="size-1.5 rounded-full bg-accent2" /> Trusted stays across Nepal
          </div>
          <h1 className="font-display text-[2.35rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Find a place that
            <br />
            feels like <span className="text-brand">home.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-stone2 sm:text-base">
            Discover verified homes, apartments, hotels, rooms, homestays and cottages across Nepal
            — all in one tidy place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <SearchPanel values={values} onChange={setValues} onSubmit={() => go("all")} />
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-5">
        <SectionHeading
          title="Browse by type"
          meta="Categories stay separate, so you never compare a hotel room with a whole house."
          action={<span className="shrink-0 text-xs font-semibold text-stone2">5 categories</span>}
        />
        <div className="mt-4">
          <CategoryRail selected="all" onSelect={(id) => go(id)} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/explore"
              search={{
                location: "",
                checkIn: "",
                checkOut: "",
                guests: 1,
                category: c.id,
              }}
              className="rounded-2xl border border-sand bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
            >
              <p className="font-display text-base font-semibold">{c.label}</p>
              <p className="mt-1 text-[13px] text-stone2">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-5">
        <SectionHeading
          title="Featured stays"
          meta="Hand-checked listings with verified photos and hosts."
          action={
            <Link
              to="/explore"
              search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
              className="shrink-0 text-xs font-bold text-brand-deep"
            >
              See all
            </Link>
          }
        />
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-5">
        <SectionHeading title="Popular destinations" />
        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1">
          {destinations.map((d) => (
            <Link
              key={d.name}
              to="/explore"
              search={{
                location: d.name,
                checkIn: "",
                checkOut: "",
                guests: 1,
                category: "all",
              }}
              className="shrink-0 rounded-full border border-sand bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-brand/40"
            >
              {d.name} <span className="text-stone2">· {d.stays}</span>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
