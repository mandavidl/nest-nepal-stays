import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import {
  Panel,
  VerifiedBadge,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/nest/Bits";
import {
  amenityList,
  categories,
  categoryById,
  formatDate,
  formatNpr,
  properties,
  type CategoryId,
} from "@/lib/nest-data";
import { useNest, type HostListing } from "@/lib/nest-store";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Dashboard — NestNepal" },
      {
        name: "description",
        content:
          "Manage your NestNepal listings, bookings, calendar, earnings and guest reviews from one host dashboard.",
      },
      { property: "og:title", content: "Host Dashboard — NestNepal" },
      {
        property: "og:description",
        content: "Listings, bookings, calendar, earnings and reviews in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HostDashboard,
});

const sections = [
  "Overview",
  "My Properties",
  "Add Property",
  "Bookings",
  "Calendar",
  "Earnings",
  "Reviews",
  "Profile",
] as const;

type Section = (typeof sections)[number];

function HostDashboard() {
  const [section, setSection] = useState<Section>("Overview");
  const { hostListings: listings, bookings, account } = useNest();

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">
              Host dashboard
            </p>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {account.name}
            </h1>
          </div>
          <Link to="/become-a-host" className={`${ghostButtonClass} shrink-0`}>
            Hosting guide
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:h-fit lg:flex-col lg:px-0">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                aria-current={section === s}
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  section === s
                    ? "bg-ink text-cream"
                    : "border border-sand bg-surface text-stone2 hover:border-brand/40 hover:text-ink lg:border-0 lg:bg-transparent"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          <div className="space-y-5">
            {section === "Overview" && <Overview listingCount={listings.length} />}
            {section === "My Properties" && <MyProperties listings={listings} />}
            {section === "Add Property" && <AddProperty />}
            {section === "Bookings" && <HostBookings />}
            {section === "Calendar" && <HostCalendar />}
            {section === "Earnings" && <Earnings />}
            {section === "Reviews" && <HostReviews />}
            {section === "Profile" && <HostProfile />}
            {section === "Overview" && bookings.length > 0 && (
              <Panel>
                <h2 className="font-display text-lg font-semibold">Latest guest activity</h2>
                <ul className="mt-3 space-y-2 text-[14px] text-stone2">
                  {bookings.slice(0, 3).map((b) => (
                    <li key={b.id}>
                      {b.id} · {b.propertyName} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <p className="field-label">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </Panel>
  );
}

function Overview({ listingCount }: { listingCount: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Live listings" value={String(listingCount)} />
      <Stat label="Nights booked (30d)" value="24" />
      <Stat label="Earnings (30d)" value={formatNpr(78400)} />
      <Stat label="Average rating" value="4.8" />
    </div>
  );
}

function MyProperties({ listings }: { listings: Listing[] }) {
  return (
    <div className="space-y-4">
      {listings.map((l) => (
        <Panel key={l.id}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight">{l.name}</p>
              <p className="mt-0.5 text-[13px] text-stone2">
                {categoryById(l.category).label} · {l.address}
              </p>
              <p className="mt-2 text-[13px] text-stone2">
                {l.bedrooms} bedrooms · {l.beds} beds · {l.bathrooms} bathrooms · {l.guests} guests
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <VerifiedBadge label="Verified Property" />
                <VerifiedBadge label="Verified Photos" />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-semibold">{formatNpr(l.price)}</p>
              <p className="text-[11px] text-stone2">/ night</p>
              <p className="mt-2 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
                {l.status === "published" ? "Published" : "Draft"}
              </p>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

const emptyForm = {
  name: "",
  category: "homes" as CategoryId,
  address: "",
  city: "",
  description: "",
  price: 3000,
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [] as string[],
  houseRules: "",
  photoCount: 4,
  availableFrom: "",
};

function AddProperty() {
  const { addListing } = useNest();
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState("");

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (a: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  const publish = () => {
    addListing({ ...form, status: "published" });
    setPublished(form.name);
    setForm(emptyForm);
    setPreview(false);
  };

  if (published) {
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold">{published} is live</h2>
        <p className="mt-2 text-[14px] text-stone2">
          Your listing is published and now appears under My Properties. Verification badges are
          added once our team checks the photos.
        </p>
        <button onClick={() => setPublished("")} className={`${primaryButtonClass} mt-4`}>
          Add another property
        </button>
      </Panel>
    );
  }

  if (preview) {
    return (
      <Panel>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">
          Listing preview
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
          {form.name || "Untitled property"}
        </h2>
        <p className="mt-1 text-[13px] text-stone2">
          {categoryById(form.category).label} · {form.address || "Address not set"}
        </p>
        <p className="mt-3 font-display text-xl font-semibold">
          {formatNpr(form.price)}
          <span className="text-sm font-medium text-stone2"> / night</span>
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-stone2">
          {form.description || "No description yet."}
        </p>
        <p className="mt-3 text-[13px] text-stone2">
          {form.bedrooms} bedrooms · {form.beds} beds · {form.bathrooms} bathrooms · up to{" "}
          {form.guests} guests · {form.photoCount} photos
        </p>
        {form.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {form.amenities.map((a) => (
              <span key={a} className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold">
                {a}
              </span>
            ))}
          </div>
        )}
        {form.houseRules && (
          <p className="mt-3 whitespace-pre-line text-[13px] text-stone2">{form.houseRules}</p>
        )}
        <p className="mt-3 text-[13px] text-stone2">
          Available from {formatDate(form.availableFrom)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={publish} className={primaryButtonClass}>
            Publish listing
          </button>
          <button onClick={() => setPreview(false)} className={ghostButtonClass}>
            Keep editing
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <h2 className="font-display text-xl font-semibold">Add a property</h2>
      <p className="mt-1 text-[13px] text-stone2">
        Pick one category — guests browse categories separately.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPreview(true);
        }}
        className="mt-5 space-y-4"
      >
        <label className="block">
          <span className="field-label">Property name</span>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Lakeside Garden Apartment"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <div>
          <span className="field-label">Category</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => set("category", c.id)}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  form.category === c.id
                    ? "border-brand bg-cream text-brand-deep"
                    : "border-sand bg-surface text-stone2 hover:border-brand/40"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Address</span>
            <input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Lakeside Ward 6, Pokhara"
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block">
            <span className="field-label">City</span>
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Pokhara"
              className={`${inputClass} mt-1.5`}
            />
          </label>
        </div>

        <label className="block">
          <span className="field-label">Description</span>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What makes this place good to stay in?"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Price per night (NPR)", "price", 500, 50000],
              ["Guest capacity", "guests", 1, 16],
              ["Bedrooms", "bedrooms", 0, 10],
              ["Beds", "beds", 1, 16],
              ["Bathrooms", "bathrooms", 1, 10],
              ["Photos uploaded", "photoCount", 1, 30],
            ] as const
          ).map(([label, key, min, max]) => (
            <label key={key} className="block">
              <span className="field-label">{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                value={form[key]}
                onChange={(e) => set(key, Number(e.target.value))}
                className={`${inputClass} mt-1.5`}
              />
            </label>
          ))}
        </div>

        <div>
          <span className="field-label">Amenities</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {amenityList.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  form.amenities.includes(a)
                    ? "border-brand bg-cream text-brand-deep"
                    : "border-sand bg-surface text-stone2 hover:border-brand/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="field-label">House rules</span>
          <textarea
            rows={3}
            value={form.houseRules}
            onChange={(e) => set("houseRules", e.target.value)}
            placeholder="Check-in after 2 PM. No smoking indoors."
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label className="block">
          <span className="field-label">Available from</span>
          <input
            type="date"
            required
            value={form.availableFrom}
            onChange={(e) => set("availableFrom", e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <button type="submit" className={`${primaryButtonClass} w-full`}>
          Preview listing
        </button>
      </form>
    </Panel>
  );
}

function HostBookings() {
  const { bookings } = useNest();
  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <Panel key={b.id}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="font-semibold">{b.propertyName}</p>
              <p className="mt-0.5 text-[13px] text-stone2">
                {b.id} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.guests} guests
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-semibold">{formatNpr(b.total)}</p>
              <p className="text-[11px] capitalize text-stone2">{b.status}</p>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function HostCalendar() {
  const booked = [4, 5, 6, 12, 13, 19, 20, 21];
  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">Calendar</h2>
      <p className="mt-1 text-[13px] text-stone2">Shaded days are already reserved this month.</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`} className="text-center text-[11px] font-semibold text-stone2">
            {d}
          </span>
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
          <span
            key={d}
            className={`grid aspect-square place-items-center rounded-xl text-[12px] font-semibold ${
              booked.includes(d) ? "bg-brand/15 text-brand-deep" : "bg-cream"
            }`}
          >
            {d}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function Earnings() {
  const months = [
    ["April 2026", 78400],
    ["March 2026", 64200],
    ["February 2026", 51800],
    ["January 2026", 46500],
  ] as const;
  const max = Math.max(...months.map(([, v]) => v));
  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">Earnings</h2>
      <p className="mt-1 text-[13px] text-stone2">
        Payouts in NPR, after the NestNepal service fee.
      </p>
      <div className="mt-4 space-y-3">
        {months.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-stone2">{label}</span>
              <span className="font-semibold">{formatNpr(value)}</span>
            </div>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-sand">
              <span
                className="block h-full rounded-full bg-brand"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HostReviews() {
  const reviews = properties.slice(0, 3).flatMap((p) =>
    p.reviews.map((r) => ({ ...r, property: p.name })),
  );
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <Panel key={`${r.property}-${r.id}`}>
          <p className="text-[13px] font-semibold text-brand-deep">{r.property}</p>
          <p className="mt-1 text-[13px] text-stone2">
            {r.guest} · stayed {r.stayedOn} · ★ {r.rating.toFixed(1)}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-stone2">{r.text}</p>
        </Panel>
      ))}
    </div>
  );
}

function HostProfile() {
  const { account } = useNest();
  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">Host profile</h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="field-label">Display name</span>
          <input defaultValue={account.name} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input defaultValue={account.email} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block">
          <span className="field-label">About you</span>
          <textarea
            rows={3}
            defaultValue="Hosting in Pokhara and Nagarkot since 2021."
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <VerifiedBadge label="Verified Host" />
          <VerifiedBadge label="ID checked" />
        </div>
        <button className={primaryButtonClass}>Save profile</button>
      </div>
    </Panel>
  );
}
