import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nest/Shell";
import { Panel, brandButtonClass, ghostButtonClass } from "@/components/nest/Bits";
import { formatNpr } from "@/lib/nest-data";
import hostHero from "@/assets/host-hero.jpg";
import { HostVerification } from "@/components/nest/HostVerification";

export const Route = createFileRoute("/become-a-host")({
  head: () => ({
    meta: [
      { title: "Become a Host on NestNepal — List Your Property" },
      {
        name: "description",
        content:
          "List your home, apartment, hotel room, private room, homestay or cottage on NestNepal. Set your nightly rate in NPR and manage bookings from one dashboard.",
      },
      { property: "og:title", content: "Become a Host on NestNepal" },
      {
        property: "og:description",
        content: "List your Nepali property, set your own nightly rate, and manage every booking.",
      },
    ],
  }),
  component: BecomeHost,
});

const steps = [
  ["1. Describe your place", "Category, address, rooms, capacity and house rules."],
  ["2. Add photos and price", "Upload photos, set your nightly rate in NPR and cleaning fee."],
  ["3. Get verified", "We check the property, your ID and the photos before publishing."],
  ["4. Welcome guests", "Manage bookings, calendar and earnings from your host dashboard."],
];

const earnings = [
  ["Private room in Kathmandu", 2100, 18],
  ["Homestay room in Bandipur", 2400, 22],
  ["Cottage in Nagarkot", 2800, 16],
];

function BecomeHost() {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">
              Hosting on NestNepal
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Your place, listed properly.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-stone2 sm:text-base">
              Hosts on NestNepal choose one clear category, so guests arriving at your door know
              exactly what they booked. Set your own nightly rate in NPR and keep control of your
              calendar.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#host-verification" className={brandButtonClass}>
                Request host verification
              </a>
              <Link to="/host" className={ghostButtonClass}>
                Open host dashboard
              </Link>
            </div>
          </div>
          <img
            src={hostHero}
            alt="Terraced hillside village homes in Nepal at sunrise"
            width={1600}
            height={900}
            className="aspect-[16/10] w-full rounded-3xl border border-sand object-cover shadow-card"
          />
        </div>
      </section>

      <section id="host-verification" className="mx-auto mt-12 max-w-3xl px-5">
        <HostVerification />
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How listing works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, body]) => (
            <Panel key={title}>
              <p className="font-display text-base font-semibold">{title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-stone2">{body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What hosts like yours earn
        </h2>
        <p className="mt-1 text-[13px] text-stone2">
          Estimates based on current NestNepal listings and average nights booked per month.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {earnings.map(([label, rate, nights]) => (
            <Panel key={label as string}>
              <p className="text-[13px] text-stone2">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {formatNpr((rate as number) * (nights as number))}
              </p>
              <p className="mt-1 text-[13px] text-stone2">
                per month · {formatNpr(rate as number)} × {nights} nights
              </p>
            </Panel>
          ))}
        </div>
      </section>
    </Shell>
  );
}
