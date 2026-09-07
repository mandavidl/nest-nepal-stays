import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, Stars, VerifiedBadge, primaryButtonClass } from "@/components/nest/Bits";
import {
  formatNpr,
  nightsBetween,
  propertyById,
  quote,
  type Property,
} from "@/lib/nest-data";
import { useNest } from "@/lib/nest-store";

export const Route = createFileRoute("/property/$propertyId")({
  loader: ({ params }) => {
    const property = propertyById(params.propertyId);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Stay unavailable — NestNepal" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.property;
    const title = `${p.name}, ${p.city} — NestNepal`;
    const description = `${p.typeLabel} in ${p.city}. ${p.bedrooms} bedrooms, up to ${p.guests} guests, ${formatNpr(p.price)} per night. Rated ${p.rating} from ${p.reviewCount} reviews.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PropertyDetail,
});

const ratingRows = [
  ["Cleanliness", "cleanliness"],
  ["Accuracy", "accuracy"],
  ["Location", "location"],
  ["Check-in", "checkIn"],
  ["Communication", "communication"],
  ["Value", "value"],
] as const;

function PropertyDetail() {
  const { property } = Route.useLoaderData();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useNest();
  const [active, setActive] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const nights = nightsBetween(checkIn, checkOut);
  const q = quote(property, nights);
  const saved = isFavorite(property.id);

  const reserve = () =>
    navigate({
      to: "/book/$propertyId",
      params: { propertyId: property.id },
      search: { checkIn, checkOut, guests },
    });

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <Link
          to="/explore"
          search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: property.category }}
          className="text-xs font-semibold text-brand-deep"
        >
          ← Back to {property.typeLabel.toLowerCase()} results
        </Link>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {property.name}
            </h1>
            <p className="mt-1 text-[13px] text-stone2">
              {property.typeLabel} · {property.area}, {property.city}, Nepal
            </p>
            <div className="mt-2">
              <Stars rating={property.rating} count={property.reviewCount} />
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(property.id)}
            className="shrink-0 rounded-2xl border border-sand bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand/40"
          >
            {saved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <img
            src={property.gallery[active] ?? property.image}
            alt={`${property.name} — photo ${active + 1}`}
            width={1280}
            height={800}
            className="aspect-[16/10] w-full rounded-3xl border border-sand object-cover shadow-card"
          />
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
            {property.gallery.map((g, i) => (
              <button
                key={`${g}-${i}`}
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`overflow-hidden rounded-2xl border-2 transition-all ${
                  i === active ? "border-brand" : "border-sand hover:border-brand/40"
                }`}
              >
                <img
                  src={g}
                  alt={`${property.name} thumbnail ${i + 1}`}
                  loading="lazy"
                  width={640}
                  height={400}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Panel>
              <div className="flex flex-wrap gap-1.5">
                {property.badges.map((b) => (
                  <VerifiedBadge key={b} label={b} />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Bedrooms", property.bedrooms],
                  ["Beds", property.beds],
                  ["Bathrooms", property.bathrooms],
                  ["Max guests", property.guests],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="font-display text-2xl font-semibold">{value}</p>
                    <p className="text-[13px] text-stone2">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-stone2">{property.description}</p>
            </Panel>

            <Panel>
              <h2 className="font-display text-lg font-semibold">Your host</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream font-display text-lg font-semibold text-brand-deep">
                  {property.host.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{property.host.name}</p>
                  <p className="text-[13px] text-stone2">
                    Hosting since {property.host.since} · {property.host.responseRate}% response rate
                  </p>
                </div>
              </div>
              {property.host.verified && (
                <div className="mt-3">
                  <VerifiedBadge label="Verified Host" />
                </div>
              )}
            </Panel>

            <Panel>
              <h2 className="font-display text-lg font-semibold">Amenities</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-[14px] sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <li key={a} className="rounded-2xl bg-cream px-3 py-2 font-medium">
                    {a}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <h2 className="font-display text-lg font-semibold">House rules</h2>
              <ul className="mt-3 space-y-2 text-[14px] text-stone2">
                {property.houseRules.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-brand">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <h2 className="font-display text-lg font-semibold">Availability</h2>
              <p className="mt-1 text-[13px] text-stone2">
                Shaded dates are already booked this month.
              </p>
              <Calendar property={property} />
            </Panel>

            <Panel>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">Reviews</h2>
                <Stars rating={property.rating} count={property.reviewCount} />
              </div>
              <p className="mt-1 text-[13px] text-stone2">
                Only guests who completed a stay here can leave a review.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ratingRows.map(([label, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[13px] text-stone2">{label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${(property.ratingBreakdown[key] / 5) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-[13px] font-semibold">
                      {property.ratingBreakdown[key].toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {property.reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-cream p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-xs font-bold text-brand-deep">
                        {r.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{r.guest}</p>
                        <p className="text-[12px] text-stone2">
                          Stayed {r.stayedOn} · ★ {r.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-stone2">{r.text}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Panel>
              <div className="flex items-end justify-between">
                <p className="font-display text-2xl font-semibold">
                  {formatNpr(property.price)}
                  <span className="text-sm font-medium text-stone2"> / night</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="rounded-2xl bg-cream px-3 py-2.5">
                  <span className="field-label">Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="mt-0.5 w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </label>
                <label className="rounded-2xl bg-cream px-3 py-2.5">
                  <span className="field-label">Check-out</span>
                  <input
                    type="date"
                    min={checkIn || undefined}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-0.5 w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </label>
                <label className="col-span-2 rounded-2xl bg-cream px-3 py-2.5">
                  <span className="field-label">Guests</span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-0.5 w-full bg-transparent text-sm font-semibold outline-none"
                  >
                    {Array.from({ length: property.guests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} guest{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {nights > 0 ? (
                <dl className="mt-4 space-y-2 text-[14px]">
                  <Row
                    label={`${formatNpr(property.price)} × ${nights} night${nights > 1 ? "s" : ""}`}
                    value={formatNpr(q.subtotal)}
                  />
                  {q.cleaningFee > 0 && (
                    <Row label="Cleaning fee" value={formatNpr(q.cleaningFee)} />
                  )}
                  <Row label="Service fee" value={formatNpr(q.serviceFee)} />
                  <div className="mt-3 flex items-center justify-between border-t border-sand pt-3">
                    <span className="font-display text-base font-semibold">Total</span>
                    <span className="font-display text-lg font-semibold">{formatNpr(q.total)}</span>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[13px] text-stone2">
                  Pick your dates to see the complete price — cleaning and service fees included, no
                  hidden extras.
                </p>
              )}

              <button
                onClick={reserve}
                disabled={nights === 0}
                className={`${primaryButtonClass} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Reserve
              </button>
              <p className="mt-2 text-center text-[11px] text-stone2">
                You won't be charged yet · prices in NPR
              </p>
            </Panel>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-stone2">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Calendar({ property }: { property: Property }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <span key={`${d}-${i}`} className="text-center text-[11px] font-semibold text-stone2">
          {d}
        </span>
      ))}
      {days.map((d) => {
        const booked = property.bookedDays.includes(d);
        return (
          <span
            key={d}
            className={`grid aspect-square place-items-center rounded-xl text-[12px] font-semibold ${
              booked ? "bg-sand text-stone2 line-through" : "bg-cream text-ink"
            }`}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}
