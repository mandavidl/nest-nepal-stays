import { Link } from "@tanstack/react-router";
import { formatNpr, type Property } from "@/lib/nest-data";
import { useNest } from "@/lib/nest-store";

export function PropertyCard({ property }: { property: Property }) {
  const { isFavorite, toggleFavorite } = useNest();
  const saved = isFavorite(property.id);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-sand bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/property/$propertyId"
        params={{ propertyId: property.id }}
        className="block"
        aria-label={`View ${property.name}`}
      >
        <div className="relative overflow-hidden">
          <img
            src={property.image}
            alt={`${property.typeLabel} in ${property.city}: ${property.name}`}
            loading="lazy"
            width={1280}
            height={800}
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold shadow-sm">
            {property.typeLabel}
          </span>
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-cream">
            <span className="text-accent2">★</span> {property.rating.toFixed(1)} ·{" "}
            {property.reviewCount}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-semibold leading-tight">
                {property.name}
              </h3>
              <p className="mt-0.5 text-[13px] text-stone2">
                {property.city}, Nepal · {property.bedrooms} bed · {property.guests} guests
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-semibold leading-none">
                {formatNpr(property.price)}
              </p>
              <p className="text-[11px] text-stone2">/ night</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.badges.slice(0, 3).map((b) => (
              <span
                key={b}
                className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-brand-deep"
              >
                ✓ {b}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <button
        onClick={() => toggleFavorite(property.id)}
        aria-label={saved ? `Remove ${property.name} from saved` : `Save ${property.name}`}
        aria-pressed={saved}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-surface/95 shadow-sm transition-transform hover:scale-110"
      >
        <span className={`text-sm font-bold ${saved ? "text-brand" : "text-stone2"}`}>
          {saved ? "♥" : "♡"}
        </span>
      </button>
    </article>
  );
}
