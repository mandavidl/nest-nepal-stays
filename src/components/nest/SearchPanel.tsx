import { destinations } from "@/lib/nest-data";

export type SearchValues = {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

const cell =
  "rounded-2xl bg-cream px-4 py-3 transition-colors focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand/30";
const control =
  "mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink outline-none";

export function SearchPanel({
  values,
  onChange,
  onSubmit,
  compact = false,
}: {
  values: SearchValues;
  onChange: (next: SearchValues) => void;
  onSubmit: () => void;
  compact?: boolean;
}) {
  const set = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={`rounded-3xl border border-sand bg-surface p-2 ${compact ? "shadow-card" : "shadow-search"}`}
    >
      <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
        <div className={`col-span-2 lg:col-span-1 ${cell}`}>
          <span className="field-label">Location</span>
          <input
            list="nn-destinations"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Anywhere in Nepal"
            className={control}
          />
          <datalist id="nn-destinations">
            {destinations.map((d) => (
              <option key={d.name} value={d.name} />
            ))}
          </datalist>
        </div>
        <div className={cell}>
          <span className="field-label">Check-in</span>
          <input
            type="date"
            value={values.checkIn}
            onChange={(e) => set("checkIn", e.target.value)}
            className={control}
          />
        </div>
        <div className={cell}>
          <span className="field-label">Check-out</span>
          <input
            type="date"
            min={values.checkIn || undefined}
            value={values.checkOut}
            onChange={(e) => set("checkOut", e.target.value)}
            className={control}
          />
        </div>
        <div className={`col-span-2 lg:col-span-1 ${cell}`}>
          <span className="field-label">Guests</span>
          <select
            value={values.guests}
            onChange={(e) => set("guests", Number(e.target.value))}
            className={control}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} guest{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-2 w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-cream transition-all hover:bg-brand-deep active:scale-[0.98]"
      >
        Search stays
      </button>
    </form>
  );
}
