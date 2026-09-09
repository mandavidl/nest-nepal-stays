import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayIso = () => toIso(new Date());

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days);
  return toIso(date);
};

export const dayOfMonth = (iso: string) => Number(iso.split("-")[2]);

export type Availability = {
  /** Dates already taken by a booking that is not cancelled. */
  blocked: Set<string>;
  /** Days of the month the host has blocked out. */
  blockedDaysOfMonth: number[];
  /** First date the host accepts guests, if set. */
  from: string | null;
  loading: boolean;
  refresh: () => Promise<Set<string>>;
};

/** True when every night from checkIn (inclusive) to checkOut (exclusive) is free. */
export const rangeIsFree = (
  checkIn: string,
  checkOut: string,
  a: { blocked: Set<string>; blockedDaysOfMonth: number[]; from: string | null },
) => {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  if (a.from && checkIn < a.from) return false;
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    if (a.blocked.has(d)) return false;
    if (a.blockedDaysOfMonth.includes(dayOfMonth(d))) return false;
  }
  return true;
};

/**
 * Single source of truth for a property's availability: booked nights come from
 * the database, plus the days and start date the host set on the listing.
 */
export function usePropertyAvailability(property: {
  id: string;
  bookedDays: number[];
  availabilityFrom: string | null;
}): Availability {
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc("property_blocked_dates", {
      _property_id: property.id,
    });
    const next = new Set<string>(((data ?? []) as string[]).map((d) => String(d).slice(0, 10)));
    setBlocked(next);
    setLoading(false);
    return next;
  }, [property.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      blocked,
      blockedDaysOfMonth: property.bookedDays ?? [],
      from: property.availabilityFrom ?? null,
      loading,
      refresh,
    }),
    [blocked, property.bookedDays, property.availabilityFrom, loading, refresh],
  );
}
