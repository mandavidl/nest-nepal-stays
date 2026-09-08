import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { RateTable } from "./currency";
import { currencies } from "./currency";

const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_SOURCE = "https://open.er-api.com/v6/latest/NPR";

const publicClient = () =>
  createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

const wanted = currencies.map((c) => c.code).filter((c) => c !== "NPR");

/** Live NPR exchange rates, cached in the database for an hour. Returns null when unavailable. */
export const getExchangeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RateTable | null> => {
    const client = publicClient();
    const { data: cached } = await client
      .from("exchange_rates")
      .select("base, rates, fetched_at")
      .eq("base", "NPR")
      .maybeSingle();

    const fetchedAt = cached?.fetched_at ? new Date(cached.fetched_at).getTime() : 0;
    if (cached?.rates && Date.now() - fetchedAt < CACHE_TTL_MS) {
      return {
        base: "NPR",
        rates: cached.rates as Record<string, number>,
        fetchedAt: new Date(fetchedAt).toISOString(),
      };
    }

    try {
      const response = await fetch(RATE_SOURCE);
      if (!response.ok) throw new Error(`Rate provider responded ${response.status}`);
      const payload = (await response.json()) as { rates?: Record<string, number> };
      const rates: Record<string, number> = {};
      for (const code of wanted) {
        const value = payload.rates?.[code];
        if (typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = value;
      }
      if (!Object.keys(rates).length) throw new Error("No usable rates returned");

      const now = new Date().toISOString();
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("exchange_rates")
        .upsert({ base: "NPR", rates, fetched_at: now }, { onConflict: "base" });
      return { base: "NPR", rates, fetchedAt: now };
    } catch (error) {
      console.error("[currency] rate refresh failed", error);
      if (cached?.rates) {
        return {
          base: "NPR",
          rates: cached.rates as Record<string, number>,
          fetchedAt: new Date(fetchedAt).toISOString(),
        };
      }
      return null;
    }
  },
);
