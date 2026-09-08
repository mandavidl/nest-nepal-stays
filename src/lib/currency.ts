/** Multi-currency display. Every price is stored in NPR and converted for display only. */

export type CurrencyCode =
  | "NPR"
  | "INR"
  | "USD"
  | "GBP"
  | "EUR"
  | "AUD"
  | "CAD"
  | "JPY"
  | "CNY"
  | "KRW"
  | "SGD"
  | "AED";

export type CurrencyInfo = {
  code: CurrencyCode;
  flag: string;
  name: string;
  decimals: number;
};

export const currencies: CurrencyInfo[] = [
  { code: "NPR", flag: "🇳🇵", name: "Nepalese Rupee", decimals: 0 },
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee", decimals: 0 },
  { code: "USD", flag: "🇺🇸", name: "US Dollar", decimals: 2 },
  { code: "GBP", flag: "🇬🇧", name: "British Pound", decimals: 2 },
  { code: "EUR", flag: "🇪🇺", name: "Euro", decimals: 2 },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar", decimals: 2 },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar", decimals: 2 },
  { code: "JPY", flag: "🇯🇵", name: "Japanese Yen", decimals: 0 },
  { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan", decimals: 2 },
  { code: "KRW", flag: "🇰🇷", name: "South Korean Won", decimals: 0 },
  { code: "SGD", flag: "🇸🇬", name: "Singapore Dollar", decimals: 2 },
  { code: "AED", flag: "🇦🇪", name: "UAE Dirham", decimals: 2 },
];

export const isCurrencyCode = (value: string): value is CurrencyCode =>
  currencies.some((c) => c.code === value);

export const currencyInfo = (code: CurrencyCode): CurrencyInfo =>
  currencies.find((c) => c.code === code) ?? { code: "NPR", flag: "🇳🇵", name: "Nepalese Rupee", decimals: 0 };

export type RateTable = {
  base: "NPR";
  rates: Record<string, number>;
  fetchedAt: string;
};

/** Converts an original NPR amount into the target currency. Returns null when no rate is known. */
export const convertFromNpr = (
  npr: number,
  code: CurrencyCode,
  table: RateTable | null,
): { amount: number; rate: number } | null => {
  if (code === "NPR") return { amount: npr, rate: 1 };
  const rate = table?.rates?.[code];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return { amount: npr * rate, rate };
};

export const formatMoney = (amount: number, code: CurrencyCode): string => {
  const info = currencyInfo(code);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: info.decimals,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${Math.round(amount).toLocaleString("en-US")}`;
  }
};

export const formatNprAmount = (npr: number) => `NPR ${Math.round(npr).toLocaleString("en-US")}`;

export const CONVERSION_NOTE =
  "Prices are converted estimates based on current exchange rates.";
