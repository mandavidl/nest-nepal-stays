import { useNest } from "@/lib/nest-store";
import { currencies, isCurrencyCode } from "@/lib/currency";

export function CurrencySelect({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useNest();

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(e) => {
          const next = e.target.value;
          if (isCurrencyCode(next)) void setCurrency(next);
        }}
        className="rounded-full border border-sand bg-surface px-3 py-2 text-sm font-semibold outline-none transition-colors hover:border-brand/40"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
