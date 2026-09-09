import { useState } from "react";
import { addDays, dayOfMonth, todayIso, toIso, type Availability } from "@/lib/availability";

const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

type Props = {
  availability: Availability;
  /** Omit to render a read-only availability view. */
  selectable?: boolean;
  checkIn?: string;
  checkOut?: string;
  onSelect?: (checkIn: string, checkOut: string) => void;
};

/**
 * The one calendar used by both the listing availability section and the
 * reservation date picker, so unavailable dates are identical in both places.
 */
export function AvailabilityCalendar({
  availability,
  selectable = false,
  checkIn = "",
  checkOut = "",
  onSelect,
}: Props) {
  const start = new Date();
  const [cursor, setCursor] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const today = todayIso();

  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();

  const isBlocked = (iso: string) =>
    availability.blocked.has(iso) || availability.blockedDaysOfMonth.includes(dayOfMonth(iso));

  const isDisabled = (iso: string) =>
    iso < today || isBlocked(iso) || Boolean(availability.from && iso < availability.from);

  const inRange = (iso: string) => Boolean(checkIn && checkOut && iso >= checkIn && iso < checkOut);

  const pick = (iso: string) => {
    if (!onSelect || isDisabled(iso)) return;
    if (!checkIn || checkOut || iso <= checkIn) {
      onSelect(iso, "");
      return;
    }
    for (let d = checkIn; d < iso; d = addDays(d, 1)) {
      if (isBlocked(d)) {
        onSelect(iso, "");
        return;
      }
    }
    onSelect(checkIn, iso);
  };

  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const atStart = cursor.y === start.getFullYear() && cursor.m === start.getMonth();

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atStart}
          aria-label="Previous month"
          className="rounded-full border border-sand px-2.5 py-1 text-xs font-semibold disabled:opacity-30"
        >
          ←
        </button>
        <p className="text-[13px] font-semibold">{monthLabel(cursor.y, cursor.m)}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="rounded-full border border-sand px-2.5 py-1 text-xs font-semibold"
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekLabels.map((d, i) => (
          <span key={`${d}-${i}`} className="text-center text-[11px] font-semibold text-stone2">
            {d}
          </span>
        ))}
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = toIso(new Date(cursor.y, cursor.m, day));
          const disabled = isDisabled(iso);
          const selected = iso === checkIn || iso === checkOut;
          const base =
            "grid aspect-square place-items-center rounded-xl text-[12px] font-semibold transition-colors";
          const look = disabled
            ? "bg-sand text-stone2/70 line-through cursor-not-allowed"
            : selected
              ? "bg-ink text-cream"
              : inRange(iso)
                ? "bg-cream text-brand-deep ring-1 ring-brand/40"
                : "bg-cream text-ink";
          return selectable ? (
            <button
              key={iso}
              type="button"
              onClick={() => pick(iso)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={`${iso}${disabled ? " unavailable" : ""}`}
              className={`${base} ${look} ${disabled ? "" : "hover:ring-1 hover:ring-brand/50"}`}
            >
              {day}
            </button>
          ) : (
            <span key={iso} aria-label={`${iso}${disabled ? " unavailable" : ""}`} className={`${base} ${look}`}>
              {day}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[12px] text-stone2">
        Crossed-out dates are unavailable and cannot be selected.
        {availability.from ? ` This place accepts guests from ${availability.from}.` : ""}
      </p>
    </div>
  );
}
