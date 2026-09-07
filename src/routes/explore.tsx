import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { SearchPanel, type SearchValues } from "@/components/nest/SearchPanel";
import { CategoryRail } from "@/components/nest/CategoryRail";
import { PropertyCard } from "@/components/nest/PropertyCard";
import { ghostButtonClass, SectionHeading } from "@/components/nest/Bits";
import {
  amenityList,
  categories,
  formatDate,
  formatNpr,
  properties,
  type CategoryId,
} from "@/lib/nest-data";
import { defaultFilters, filterProperties, type Filters } from "@/lib/nest-store";

type ExploreSearch = {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  category: CategoryId | "all";
};

const categoryIds = categories.map((c) => c.id);

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => {
    const category = String(search.category ?? "all");
    return {
      location: typeof search.location === "string" ? search.location : "",
      checkIn: typeof search.checkIn === "string" ? search.checkIn : "",
      checkOut: typeof search.checkOut === "string" ? search.checkOut : "",
      guests: Number(search.guests) > 0 ? Number(search.guests) : 1,
      category: (categoryIds as string[]).includes(category)
        ? (category as CategoryId)
        : "all",
    };
  },
  head: () => ({
    meta: [
      { title: "Explore Stays in Nepal — NestNepal" },
      {
        name: "description",
        content:
          "Search and filter verified Nepali stays by category, price, bedrooms, guests, rating and amenities. Map view included.",
      },
      { property: "og:title", content: "Explore Stays in Nepal — NestNepal" },
      {
        property: "og:description",
        content: "Filter homes, hotels, rooms, homestays and cottages across Nepal by what matters.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [values, setValues] = useState<SearchValues>({
    location: search.location,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: search.guests,
  });
  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    category: search.category,
    location: search.location,
    guests: search.guests,
  });
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => filterProperties(properties, filters), [filters]);
  const activeCategory = filters.category;
  const categoryLabel =
    activeCategory === "all"
      ? "All accommodation types"
      : (categories.find((c) => c.id === activeCategory)?.label ?? "All types");

  const applySearch = () => {
    setFilters((f) => ({ ...f, location: values.location, guests: values.guests }));
    navigate({
      to: "/explore",
      search: { ...values, category: filters.category },
      replace: true,
    });
  };

  const setCategory = (id: CategoryId | "all") => {
    setFilters((f) => ({ ...f, category: id }));
    navigate({ to: "/explore", search: { ...values, category: id }, replace: true });
  };

  const toggleAmenity = (a: string) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <SearchPanel values={values} onChange={setValues} onSubmit={applySearch} compact />
        <p className="mt-3 text-[13px] text-stone2">
          {values.location || "Anywhere in Nepal"} · {formatDate(values.checkIn)} –{" "}
          {formatDate(values.checkOut)} · {values.guests} guest{values.guests > 1 ? "s" : ""}
        </p>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-5">
        <CategoryRail selected={activeCategory} onSelect={setCategory} includeAll />
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-5">
        <SectionHeading
          title={categoryLabel}
          meta={`${results.length} stay${results.length === 1 ? "" : "s"} match your search`}
          action={
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="rounded-2xl border border-sand bg-surface px-4 py-2 text-xs font-semibold transition-colors hover:border-brand/40 lg:hidden"
              >
                Filters
              </button>
              <button
                onClick={() => setShowMap((s) => !s)}
                className="rounded-2xl border border-sand bg-surface px-4 py-2 text-xs font-semibold transition-colors hover:border-brand/40"
              >
                {showMap ? "Hide map" : "Map view"}
              </button>
            </div>
          }
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className={`${showFilters ? "block" : "hidden"} h-fit rounded-3xl border border-sand bg-surface p-5 shadow-card lg:sticky lg:top-24 lg:block`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Filters</h3>
              <button
                onClick={() => setFilters({ ...defaultFilters, category: filters.category })}
                className="text-xs font-semibold text-brand-deep"
              >
                Reset
              </button>
            </div>

            <div className="mt-5">
              <p className="field-label">Price per night (max {formatNpr(filters.maxPrice)})</p>
              <input
                type="range"
                min={1000}
                max={10000}
                step={100}
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                className="mt-2 w-full accent-brand"
              />
            </div>

            {(
              [
                ["Bedrooms", "bedrooms"],
                ["Bathrooms", "bathrooms"],
                ["Guest capacity", "guests"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="mt-5">
                <p className="field-label">{label}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setFilters((f) => ({ ...f, [key]: key === "guests" && n === 0 ? 1 : n }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        filters[key] === (key === "guests" && n === 0 ? 1 : n)
                          ? "border-brand bg-cream text-brand-deep"
                          : "border-sand bg-surface text-stone2 hover:border-brand/40"
                      }`}
                    >
                      {n === 0 ? "Any" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-5">
              <p className="field-label">Rating</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0, 4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilters((f) => ({ ...f, minRating: r }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.minRating === r
                        ? "border-brand bg-cream text-brand-deep"
                        : "border-sand bg-surface text-stone2 hover:border-brand/40"
                    }`}
                  >
                    {r === 0 ? "Any" : `★ ${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="field-label">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {amenityList.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.amenities.includes(a)
                        ? "border-brand bg-cream text-brand-deep"
                        : "border-sand bg-surface text-stone2 hover:border-brand/40"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {showMap && (
              <div className="mb-5 overflow-hidden rounded-3xl border border-sand bg-surface shadow-card">
                <div className="relative h-64 bg-sand/60">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,var(--color-accent2)/35%,transparent_55%),radial-gradient(circle_at_70%_65%,var(--color-pine)/25%,transparent_55%)]" />
                  {results.slice(0, 8).map((p, i) => (
                    <span
                      key={p.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-cream shadow-card"
                      style={{
                        left: `${12 + ((i * 13) % 76)}%`,
                        top: `${18 + ((i * 27) % 60)}%`,
                      }}
                    >
                      {formatNpr(p.price)}
                    </span>
                  ))}
                </div>
                <p className="px-4 py-3 text-[13px] text-stone2">
                  Approximate locations for {results.length} stays in this search.
                </p>
              </div>
            )}

            {results.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-sand bg-surface p-8 text-center shadow-card">
                <p className="font-display text-lg font-semibold">No stays match yet</p>
                <p className="mt-2 text-[13px] text-stone2">
                  Try widening the price range or clearing a few amenities.
                </p>
                <button
                  onClick={() => setFilters({ ...defaultFilters, category: filters.category })}
                  className={`${ghostButtonClass} mt-4`}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}
