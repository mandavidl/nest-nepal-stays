import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import {
  Panel,
  Stars,
  VerifiedBadge,
  ghostButtonClass,
  primaryButtonClass,
} from "@/components/nest/Bits";
import { AvailabilityCalendar } from "@/components/nest/AvailabilityCalendar";
import { rangeIsFree, usePropertyAvailability } from "@/lib/availability";
import { formatDate, formatNpr, nightsBetween, propertyById, quote } from "@/lib/nest-data";
import { getPublicProperty } from "@/lib/properties.functions";
import { useNest, type Booking } from "@/lib/nest-store";

type BookSearch = { checkIn: string; checkOut: string; guests: number };

export const Route = createFileRoute("/book/$propertyId")({
  validateSearch: (search: Record<string, unknown>): BookSearch => {
    const guests = Number(search["guests"]);
    const str = (key: string) => (typeof search[key] === "string" ? (search[key] as string) : "");
    return { checkIn: str("checkIn"), checkOut: str("checkOut"), guests: guests > 0 ? guests : 1 };
  },
  loader: async ({ params }) => {
    const remote = await getPublicProperty({ data: { id: params.propertyId } }).catch(() => null);
    const property = remote ?? propertyById(params.propertyId);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Booking unavailable — NestNepal" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `Book ${loaderData.property.name} — NestNepal` },
        {
          name: "description",
          content: `Confirm your dates, guests and complete price for ${loaderData.property.name} in ${loaderData.property.city}.`,
        },
        { property: "og:title", content: `Book ${loaderData.property.name} — NestNepal` },
        {
          property: "og:description",
          content: "See the complete price before you confirm. No hidden fees.",
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: BookingFlow,
});

const steps = ["Dates", "Guests", "Review", "Price", "Confirm"] as const;

const UNAVAILABLE = "These dates are no longer available. Please choose different dates.";

function BookingFlow() {
  const { property } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { addBooking } = useNest();
  const availability = usePropertyAvailability(property);

  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(search.checkIn);
  const [checkOut, setCheckOut] = useState(search.checkOut);
  const [guests, setGuests] = useState(Math.min(search.guests, property.guests));
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);
  const q = quote(property, nights);
  const datesFree = rangeIsFree(checkIn, checkOut, availability);
  const canContinue = step === 0 ? datesFree : true;

  const [bookingError, setBookingError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setBookingError("");
    try {
      // Dates may have been taken while this screen was open, so check the
      // latest availability before submitting; the database checks again too.
      const latest = await availability.refresh();
      if (!rangeIsFree(checkIn, checkOut, { ...availability, blocked: latest })) {
        setBookingError(UNAVAILABLE);
        setStep(0);
        return;
      }
      const booking = await addBooking({
        propertyId: property.id,
        propertyName: property.name,
        city: property.city,
        typeLabel: property.typeLabel,
        image: property.image,
        checkIn,
        checkOut,
        guests,
        nights,
        total: q.total,
        nightlyNpr: property.price,
        hostName: property.host.name,
        hostPhone: property.host.phone ?? null,
      });
      setConfirmed(booking);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setBookingError(
        raw.includes("no longer available") || raw.includes("Check-out must be after")
          ? UNAVAILABLE
          : raw || "Booking could not be saved.",
      );
      await availability.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (confirmed) {
    return (
      <Shell>
        <section className="mx-auto max-w-2xl px-5 py-10">
          <Panel>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">
              Booking confirmed
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              You're going to {property.city}.
            </h1>
            <p className="mt-2 text-[14px] text-stone2">
              A confirmation has been sent to your account. Show booking ID {confirmed.id} at
              check-in.
            </p>

            <div className="mt-6 flex gap-4">
              <img
                src={property.image}
                alt={property.name}
                loading="lazy"
                width={1280}
                height={800}
                className="size-24 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold leading-tight">{property.name}</p>
                <p className="text-[13px] text-stone2">
                  {property.typeLabel} · {property.area}, {property.city}
                </p>
                <div className="mt-1">
                  <Stars rating={property.rating} count={property.reviewCount} />
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-2 text-[14px]">
              <Row label="Booking ID" value={confirmed.id} />
              <Row label="Dates" value={`${formatDate(checkIn)} – ${formatDate(checkOut)}`} />
              <Row label="Nights" value={String(nights)} />
              <Row label="Guests" value={String(guests)} />
              <Row label="Host" value={`${property.host.name} · ${property.host.responseRate}% response`} />
              <div className="flex items-center justify-between border-t border-sand pt-3">
                <span className="font-display text-base font-semibold">Total paid</span>
                <span className="font-display text-lg font-semibold">{formatNpr(q.total)}</span>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/account" className={primaryButtonClass}>
                View my bookings
              </Link>
              <Link
                to="/explore"
                search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
                className={ghostButtonClass}
              >
                Keep exploring
              </Link>
            </div>
          </Panel>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-5 py-8">
        <Link
          to="/property/$propertyId"
          params={{ propertyId: property.id }}
          className="text-xs font-semibold text-brand-deep"
        >
          ← Back to the listing
        </Link>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                i === step
                  ? "border-brand bg-cream text-brand-deep"
                  : i < step
                    ? "border-sand bg-surface text-stone2"
                    : "border-sand bg-surface text-stone2/60"
              }`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Panel>
            {step === 0 && (
              <>
                <h1 className="font-display text-xl font-semibold">Choose your dates</h1>
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
                </div>
                <p className="mt-3 text-[13px] text-stone2">
                  {nights > 0
                    ? `${nights} night${nights > 1 ? "s" : ""} selected.`
                    : "Pick a check-out date after your check-in date."}
                </p>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-display text-xl font-semibold">How many guests?</h1>
                <p className="mt-1 text-[13px] text-stone2">
                  This place hosts up to {property.guests} guests.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: property.guests }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setGuests(n)}
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                        guests === n
                          ? "border-brand bg-cream text-brand-deep"
                          : "border-sand bg-surface hover:border-brand/40"
                      }`}
                    >
                      {n} guest{n > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-display text-xl font-semibold">Review the property</h1>
                <div className="mt-4 flex gap-4">
                  <img
                    src={property.image}
                    alt={property.name}
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="size-24 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-tight">
                      {property.name}
                    </p>
                    <p className="text-[13px] text-stone2">
                      {property.typeLabel} · {property.bedrooms} bedrooms · {property.beds} beds ·{" "}
                      {property.bathrooms} bathrooms
                    </p>
                    <div className="mt-1">
                      <Stars rating={property.rating} count={property.reviewCount} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {property.badges.map((b) => (
                    <VerifiedBadge key={b} label={b} />
                  ))}
                </div>
                <ul className="mt-4 space-y-2 text-[13px] text-stone2">
                  {property.houseRules.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="font-display text-xl font-semibold">The complete price</h1>
                <dl className="mt-4 space-y-2 text-[14px]">
                  <Row
                    label={`${formatNpr(property.price)} × ${nights} night${nights > 1 ? "s" : ""}`}
                    value={formatNpr(q.subtotal)}
                  />
                  {q.cleaningFee > 0 && <Row label="Cleaning fee" value={formatNpr(q.cleaningFee)} />}
                  <Row label="Service fee (8%)" value={formatNpr(q.serviceFee)} />
                  <div className="flex items-center justify-between border-t border-sand pt-3">
                    <span className="font-display text-base font-semibold">Total in NPR</span>
                    <span className="font-display text-lg font-semibold">{formatNpr(q.total)}</span>
                  </div>
                </dl>
                <p className="mt-3 text-[13px] text-stone2">
                  This is everything you pay. No hidden fees are added at check-in.
                </p>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="font-display text-xl font-semibold">Confirm your booking</h1>
                <dl className="mt-4 space-y-2 text-[14px]">
                  <Row label="Property" value={property.name} />
                  <Row label="Type" value={property.typeLabel} />
                  <Row label="Dates" value={`${formatDate(checkIn)} – ${formatDate(checkOut)}`} />
                  <Row label="Guests" value={String(guests)} />
                  <Row label="Host" value={property.host.name} />
                  <div className="flex items-center justify-between border-t border-sand pt-3">
                    <span className="font-display text-base font-semibold">Total</span>
                    <span className="font-display text-lg font-semibold">{formatNpr(q.total)}</span>
                  </div>
                </dl>
                <button onClick={confirm} className={`${primaryButtonClass} mt-5 w-full`}>
                  Confirm booking
                </button>
              </>
            )}

            {step < 4 && (
              <div className="mt-6 flex gap-2">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} className={ghostButtonClass}>
                    Back
                  </button>
                )}
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue}
                  className={`${primaryButtonClass} flex-1 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Continue
                </button>
              </div>
            )}
            {step === 4 && (
              <button onClick={() => setStep(3)} className={`${ghostButtonClass} mt-3`}>
                Back
              </button>
            )}
          </Panel>

          <Panel className="h-fit">
            <p className="font-display text-lg font-semibold leading-tight">{property.name}</p>
            <p className="mt-0.5 text-[13px] text-stone2">
              {property.typeLabel} · {property.city}
            </p>
            <dl className="mt-4 space-y-2 text-[13px]">
              <Row label="Dates" value={`${formatDate(checkIn)} – ${formatDate(checkOut)}`} />
              <Row label="Guests" value={String(guests)} />
              <Row label="Nights" value={String(nights)} />
              <div className="flex items-center justify-between border-t border-sand pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-display text-base font-semibold">{formatNpr(q.total)}</span>
              </div>
            </dl>
          </Panel>
        </div>
      </section>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-stone2">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  );
}
