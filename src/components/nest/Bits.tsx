import type { ReactNode } from "react";

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
      <span className="text-brand">★</span>
      {rating.toFixed(1)}
      {count !== undefined && (
        <span className="font-medium text-stone2">({count} reviews)</span>
      )}
    </span>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
      ✓ {label}
    </span>
  );
}

export function SectionHeading({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {meta && <p className="mt-1 text-[13px] text-stone2">{meta}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-sand bg-surface p-5 shadow-card sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-sand bg-cream px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-brand focus:bg-surface";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream transition-all hover:bg-brand-deep active:scale-[0.98]";

export const brandButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-cream transition-all hover:bg-brand-deep active:scale-[0.98]";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-sand bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:bg-cream";
