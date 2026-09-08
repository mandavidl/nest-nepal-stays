import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nest/Shell";
import { PropertyCard } from "@/components/nest/PropertyCard";
import { Panel, primaryButtonClass } from "@/components/nest/Bits";
import { useNest } from "@/lib/nest-store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Stays — NestNepal" },
      {
        name: "description",
        content: "Every NestNepal property you have saved, ready to compare and book.",
      },
      { property: "og:title", content: "Saved Stays — NestNepal" },
      { property: "og:description", content: "Your shortlisted stays across Nepal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { catalog, favorites, account } = useNest();
  const saved = catalog.filter((p) => favorites.includes(p.id));

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
          Saved stays
        </h1>
        <p className="mt-1 text-[14px] text-stone2">
          {account.signedIn
            ? "Tap the heart on any listing to add it here."
            : "Log in to keep your saved stays on every device."}
        </p>

        {saved.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <Panel className="mt-6">
            <p className="font-display text-lg font-semibold">Nothing saved yet</p>
            <p className="mt-2 text-[14px] text-stone2">
              Browse stays and tap the heart — they will wait for you here.
            </p>
            <Link
              to="/explore"
              search={{ location: "", checkIn: "", checkOut: "", guests: 1, category: "all" }}
              className={`${primaryButtonClass} mt-4`}
            >
              Browse stays
            </Link>
          </Panel>
        )}
      </section>
    </Shell>
  );
}
