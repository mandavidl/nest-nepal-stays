import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { PropertyCard } from "@/components/nest/PropertyCard";
import {
  Panel,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/nest/Bits";
import { formatDate, formatNpr, properties } from "@/lib/nest-data";
import { useNest, type Booking } from "@/lib/nest-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — NestNepal" },
      {
        name: "description",
        content:
          "Your NestNepal profile, saved properties, upcoming and previous bookings, reviews and account settings.",
      },
      { property: "og:title", content: "My Account — NestNepal" },
      {
        property: "og:description",
        content: "Saved stays, bookings and reviews in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountDashboard,
});

const sections = [
  "Profile",
  "Saved properties",
  "Upcoming bookings",
  "Previous bookings",
  "Reviews",
  "Account settings",
] as const;

type Section = (typeof sections)[number];

function AccountDashboard() {
  const [section, setSection] = useState<Section>("Profile");
  const { account, favorites, bookings, signOut } = useNest();
  const saved = properties.filter((p) => favorites.includes(p.id));
  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const previous = bookings.filter((b) => b.status === "completed");

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">My account</p>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {account.signedIn ? account.name : "Guest"}
            </h1>
          </div>
          {account.signedIn ? (
            <button onClick={signOut} className={`${ghostButtonClass} shrink-0`}>
              Log out
            </button>
          ) : (
            <Link to="/login" className={`${primaryButtonClass} shrink-0`}>
              Log in
            </Link>
          )}
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
            {section === "Profile" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Panel>
                    <p className="field-label">Saved</p>
                    <p className="mt-2 font-display text-2xl font-semibold">{saved.length}</p>
                  </Panel>
                  <Panel>
                    <p className="field-label">Upcoming</p>
                    <p className="mt-2 font-display text-2xl font-semibold">{upcoming.length}</p>
                  </Panel>
                  <Panel>
                    <p className="field-label">Completed stays</p>
                    <p className="mt-2 font-display text-2xl font-semibold">{previous.length}</p>
                  </Panel>
                </div>
                <Panel>
                  <h2 className="font-display text-lg font-semibold">Your details</h2>
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="field-label">Full name</span>
                      <input defaultValue={account.name} className={`${inputClass} mt-1.5`} />
                    </label>
                    <label className="block">
                      <span className="field-label">Email</span>
                      <input defaultValue={account.email} className={`${inputClass} mt-1.5`} />
                    </label>
                    <button className={primaryButtonClass}>Save changes</button>
                  </div>
                </Panel>
              </>
            )}

            {section === "Saved properties" &&
              (saved.length ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {saved.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              ) : (
                <Panel>
                  <p className="font-display text-lg font-semibold">Nothing saved yet</p>
                  <p className="mt-2 text-[14px] text-stone2">
                    Tap the heart on any listing and it will wait for you here.
                  </p>
                  <Link
                    to="/explore"
                    search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
                    className={`${primaryButtonClass} mt-4`}
                  >
                    Browse stays
                  </Link>
                </Panel>
              ))}

            {section === "Upcoming bookings" && <BookingList list={upcoming} empty="No upcoming stays yet." />}
            {section === "Previous bookings" && <BookingList list={previous} empty="No completed stays yet." />}

            {section === "Reviews" && (
              <Panel>
                <h2 className="font-display text-lg font-semibold">Your reviews</h2>
                <p className="mt-1 text-[13px] text-stone2">
                  You can review a stay only after it is completed.
                </p>
                <div className="mt-4 space-y-3">
                  {previous.length ? (
                    previous.map((b) => (
                      <div key={b.id} className="rounded-2xl bg-cream p-4">
                        <p className="font-semibold">{b.propertyName}</p>
                        <p className="mt-0.5 text-[13px] text-stone2">
                          Stayed {formatDate(b.checkIn)} · {b.city}
                        </p>
                        <p className="mt-2 text-[14px] text-stone2">
                          {b.reviewed
                            ? "★ 5.0 — Spotless, accurate and exactly the price shown at booking."
                            : "Review not written yet."}
                        </p>
                        {!b.reviewed && (
                          <button className={`${ghostButtonClass} mt-3`}>Write a review</button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[14px] text-stone2">
                      Complete a stay and your review form will appear here.
                    </p>
                  )}
                </div>
              </Panel>
            )}

            {section === "Account settings" && (
              <Panel>
                <h2 className="font-display text-lg font-semibold">Account settings</h2>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="field-label">Phone number</span>
                    <input defaultValue="+977 98•••••••" className={`${inputClass} mt-1.5`} />
                  </label>
                  <label className="block">
                    <span className="field-label">Preferred currency</span>
                    <select className={`${inputClass} mt-1.5`} defaultValue="NPR">
                      <option value="NPR">NPR — Nepali rupee</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 text-[14px]">
                    <input type="checkbox" defaultChecked className="size-4 accent-brand" />
                    Email me about booking updates only
                  </label>
                  <button className={primaryButtonClass}>Update settings</button>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function BookingList({ list, empty }: { list: Booking[]; empty: string }) {
  if (!list.length) {
    return (
      <Panel>
        <p className="text-[14px] text-stone2">{empty}</p>
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      {list.map((b) => (
        <Panel key={b.id}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <img
              src={b.image ?? ""}
              alt={b.propertyName}
              loading="lazy"
              width={1280}
              height={800}
              className="h-24 w-full shrink-0 rounded-2xl object-cover sm:w-32"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-tight">{b.propertyName}</p>
              <p className="mt-0.5 text-[13px] text-stone2">
                {b.typeLabel} · {b.city} · host {b.hostName}
              </p>
              <p className="mt-1 text-[13px] text-stone2">
                {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} nights ·{" "}
                {b.guests} guests
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-display text-base font-semibold">{formatNpr(b.total)}</span>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
                  Booking {b.id}
                </span>
                <Link
                  to="/property/$propertyId"
                  params={{ propertyId: b.propertyId }}
                  className="text-[13px] font-semibold text-brand-deep"
                >
                  View listing
                </Link>
              </div>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
