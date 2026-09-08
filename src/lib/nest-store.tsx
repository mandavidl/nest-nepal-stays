import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { properties as demoProperties, type CategoryId, type Property } from "./nest-data";
import { mapRowToProperty, orderedPhotoPaths, type PropertyRow } from "./property-mapper";
import { signPhotoPaths } from "./nest-photos";
import { getExchangeRates } from "./currency.functions";
import {
  convertFromNpr,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
  type RateTable,
} from "./currency";

export type HostStatus = "not_host" | "pending" | "approved" | "rejected" | "suspended";

export type PropertyStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "rejected"
  | "suspended"
  | "removed";

export type Permissions = {
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  hostStatus: HostStatus;
};

export type Booking = {
  id: string;
  reference: string;
  propertyId: string;
  propertyName: string;
  city: string;
  typeLabel: string;
  image: string | null;
  hostName: string;
  hostPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: "upcoming" | "completed" | "cancelled";
  reviewed: boolean;
  guestCurrency: CurrencyCode;
  convertedAmount: number | null;
  exchangeRateUsed: number | null;
  rateTimestamp: string | null;
};

export type NewBooking = {
  propertyId: string;
  propertyName: string;
  city: string;
  typeLabel: string;
  image: string | null;
  hostName: string;
  hostPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  nightlyNpr: number;
};

export type HostListing = {
  property: Property;
  row: PropertyRow;
  photoUrls: Record<string, string>;
};

export type HostApplication = {
  id: string;
  status: HostStatus | "pending" | "approved" | "rejected";
  message: string | null;
  decisionNote: string | null;
  createdAt: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  currency: CurrencyCode;
  hostStatus: HostStatus;
  createdAt: string | null;
};

type Account = {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  createdAt: string | null;
  signedIn: boolean;
};

type Store = {
  ready: boolean;
  user: User | null;
  account: Account;
  profile: Profile | null;
  permissions: Permissions;
  catalog: Property[];
  catalogLoading: boolean;
  propertyLookup: (id: string) => Property | undefined;
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<boolean>;
  bookings: Booking[];
  addBooking: (b: NewBooking) => Promise<Booking>;
  hostListings: HostListing[];
  hostBookings: Booking[];
  refreshHostListings: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    avatarUrl?: string | null;
  }) => Promise<void>;
  hostApplication: HostApplication | null;
  requestHostVerification: (message: string, phone: string) => Promise<void>;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  rates: RateTable | null;
  /** Converted price in the guest's chosen currency, or null when NPR is selected / no rate. */
  altPrice: (npr: number) => string | null;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

const CURRENCY_KEY = "nestnepal-currency";

const guestPermissions: Permissions = {
  isOwner: false,
  isAdmin: false,
  isStaff: false,
  hostStatus: "not_host",
};

const mapBooking = (row: Record<string, unknown>): Booking => ({
  id: String(row["id"]),
  reference: String(row["reference"] ?? ""),
  propertyId: String(row["property_id"]),
  propertyName: String(row["property_name"] ?? ""),
  city: String(row["city"] ?? ""),
  typeLabel: String(row["type_label"] ?? ""),
  image: (row["image"] as string | null) ?? null,
  hostName: String(row["host_name"] ?? ""),
  hostPhone: (row["host_phone"] as string | null) ?? null,
  checkIn: String(row["check_in"]),
  checkOut: String(row["check_out"]),
  guests: Number(row["guests"] ?? 1),
  nights: Number(row["nights"] ?? 1),
  total: Number(row["total"] ?? 0),
  status: (row["status"] as Booking["status"]) ?? "upcoming",
  reviewed: Boolean(row["reviewed"]),
  guestCurrency: (isCurrencyCode(String(row["guest_currency"] ?? "NPR"))
    ? String(row["guest_currency"])
    : "NPR") as CurrencyCode,
  convertedAmount: row["converted_amount"] === null ? null : Number(row["converted_amount"]),
  exchangeRateUsed: row["exchange_rate_used"] === null ? null : Number(row["exchange_rate_used"]),
  rateTimestamp: (row["rate_timestamp"] as string | null) ?? null,
});

export function NestStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(guestPermissions);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hostListings, setHostListings] = useState<HostListing[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [hostApplication, setHostApplication] = useState<HostApplication | null>(null);
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [currency, setCurrencyState] = useState<CurrencyCode>("NPR");
  const [rates, setRates] = useState<RateTable | null>(null);

  const loadProfile = useCallback(async (u: User) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone_number, avatar_url, currency, host_status, created_at")
      .eq("id", u.id)
      .maybeSingle();
    const code = isCurrencyCode(String(data?.currency ?? "NPR"))
      ? (String(data?.currency) as CurrencyCode)
      : "NPR";
    setProfile({
      id: u.id,
      name: data?.full_name || (u.email?.split("@")[0] ?? "Guest"),
      email: data?.email || u.email || "",
      phone: data?.phone_number || "",
      avatarUrl: data?.avatar_url ?? null,
      currency: code,
      hostStatus: (data?.host_status as HostStatus) ?? "not_host",
      createdAt: data?.created_at ?? null,
    });
    setCurrencyState(code);
  }, []);

  const loadPermissions = useCallback(async () => {
    const { data } = await supabase.rpc("my_permissions");
    const p = (data ?? {}) as Record<string, unknown>;
    setPermissions({
      isOwner: Boolean(p["is_owner"]),
      isAdmin: Boolean(p["is_admin"]),
      isStaff: Boolean(p["is_staff"]),
      hostStatus: (p["host_status"] as HostStatus) ?? "not_host",
    });
  }, []);

  const loadHostApplication = useCallback(async (u: User) => {
    const { data } = await supabase
      .from("host_applications")
      .select("id, status, message, decision_note, created_at")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setHostApplication(
      data
        ? {
            id: data.id,
            status: data.status as HostApplication["status"],
            message: data.message,
            decisionNote: data.decision_note,
            createdAt: data.created_at,
          }
        : null,
    );
  }, []);

  const loadFavorites = useCallback(async () => {
    const { data } = await supabase.from("favorites").select("property_id");
    setFavorites((data ?? []).map((f) => f.property_id));
  }, []);

  const loadBookings = useCallback(async (u: User) => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("guest_id", u.id)
      .order("check_in", { ascending: false });
    setBookings((data ?? []).map((row) => mapBooking(row as Record<string, unknown>)));
  }, []);

  const refreshHostListings = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const uid = sessionData.user?.id;
    if (!uid) {
      setHostListings([]);
      setHostBookings([]);
      return;
    }
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("host_id", uid)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as PropertyRow[];
    const urls = await signPhotoPaths([...new Set(rows.flatMap((r) => orderedPhotoPaths(r)))]);
    setHostListings(
      rows.map((row) => ({ row, photoUrls: urls, property: mapRowToProperty(row, urls) })),
    );

    const ids = rows.map((r) => r.id);
    if (!ids.length) {
      setHostBookings([]);
      return;
    }
    const { data: hb } = await supabase
      .from("bookings")
      .select("*")
      .in("property_id", ids)
      .order("check_in", { ascending: false });
    setHostBookings((hb ?? []).map((row) => mapBooking(row as Record<string, unknown>)));
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("property_status", "published")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as PropertyRow[];
    const urls = await signPhotoPaths([...new Set(rows.flatMap((r) => orderedPhotoPaths(r)))]);
    setDbProperties(rows.map((row) => mapRowToProperty(row, urls)));
    setCatalogLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = async (session: Session | null) => {
      const nextUser = session?.user ?? null;
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setPermissions(guestPermissions);
        setFavorites([]);
        setBookings([]);
        setHostListings([]);
        setHostBookings([]);
        setHostApplication(null);
        const stored = typeof window !== "undefined" ? localStorage.getItem(CURRENCY_KEY) : null;
        if (stored && isCurrencyCode(stored)) setCurrencyState(stored);
        setReady(true);
        return;
      }
      await Promise.all([
        loadProfile(nextUser),
        loadPermissions(),
        loadHostApplication(nextUser),
        loadFavorites(),
        loadBookings(nextUser),
        refreshHostListings(),
      ]);
      if (active) setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void applySession(session);
      }
    });

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    void refreshCatalog();
    void getExchangeRates()
      .then((table) => {
        if (active) setRates(table);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [
    loadProfile,
    loadPermissions,
    loadHostApplication,
    loadFavorites,
    loadBookings,
    refreshHostListings,
    refreshCatalog,
  ]);

  const catalog = useMemo(() => [...dbProperties, ...demoProperties], [dbProperties]);

  const propertyLookup = useCallback(
    (id: string) =>
      dbProperties.find((p) => p.id === id) ??
      demoProperties.find((p) => p.id === id) ??
      hostListings.find((l) => l.property.id === id)?.property,
    [dbProperties, hostListings],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user) return false;
      const saved = favorites.includes(id);
      setFavorites((prev) => (saved ? prev.filter((f) => f !== id) : [...prev, id]));
      if (saved) {
        await supabase.from("favorites").delete().eq("property_id", id).eq("user_id", user.id);
      } else {
        await supabase.from("favorites").insert({ property_id: id, user_id: user.id });
      }
      return true;
    },
    [favorites, user],
  );

  const addBooking = useCallback(
    async (b: NewBooking) => {
      if (!user) throw new Error("Please log in to confirm this booking.");
      const converted = convertFromNpr(b.total, currency, rates);
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          guest_id: user.id,
          property_id: b.propertyId,
          property_name: b.propertyName,
          city: b.city,
          type_label: b.typeLabel,
          image: b.image,
          host_name: b.hostName,
          host_phone: b.hostPhone,
          check_in: b.checkIn,
          check_out: b.checkOut,
          guests: b.guests,
          nights: b.nights,
          total: b.total,
          original_property_price: b.nightlyNpr,
          original_currency: "NPR",
          guest_currency: currency,
          exchange_rate_used: converted ? converted.rate : null,
          converted_amount: converted ? converted.amount : null,
          rate_timestamp: rates?.fetchedAt ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      const booking = mapBooking(data as Record<string, unknown>);
      setBookings((prev) => [booking, ...prev]);
      return booking;
    },
    [user, currency, rates],
  );

  const updateProfile = useCallback(
    async (patch: { name?: string; phone?: string; avatarUrl?: string | null }) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(patch.name !== undefined ? { full_name: patch.name } : {}),
          ...(patch.phone !== undefined ? { phone_number: patch.phone } : {}),
          ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
        })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      setProfile((p) =>
        p
          ? {
              ...p,
              name: patch.name ?? p.name,
              phone: patch.phone ?? p.phone,
              avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : p.avatarUrl,
            }
          : p,
      );
    },
    [user],
  );

  const setCurrency = useCallback(
    async (code: CurrencyCode) => {
      setCurrencyState(code);
      if (typeof window !== "undefined") localStorage.setItem(CURRENCY_KEY, code);
      if (user) {
        await supabase.from("profiles").update({ currency: code }).eq("id", user.id);
        setProfile((p) => (p ? { ...p, currency: code } : p));
      }
    },
    [user],
  );

  const requestHostVerification = useCallback(
    async (message: string, phone: string) => {
      if (!user) throw new Error("Please log in first.");
      const { data, error } = await supabase
        .from("host_applications")
        .insert({
          user_id: user.id,
          full_name: profile?.name ?? "",
          email: profile?.email ?? user.email ?? "",
          phone_number: phone,
          message,
          status: "pending",
        })
        .select("id, status, message, decision_note, created_at")
        .single();
      if (error) throw new Error(error.message);
      setHostApplication({
        id: data.id,
        status: data.status as HostApplication["status"],
        message: data.message,
        decisionNote: data.decision_note,
        createdAt: data.created_at,
      });
      await Promise.all([loadPermissions(), loadProfile(user)]);
    },
    [user, profile, loadPermissions, loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPermissions(guestPermissions);
    setFavorites([]);
    setBookings([]);
    setHostListings([]);
    setHostBookings([]);
    setHostApplication(null);
  }, []);

  const altPrice = useCallback(
    (npr: number) => {
      if (currency === "NPR") return null;
      const converted = convertFromNpr(npr, currency, rates);
      if (!converted) return null;
      return `≈ ${formatMoney(converted.amount, currency)}`;
    },
    [currency, rates],
  );

  const account = useMemo<Account>(
    () => ({
      id: user?.id ?? null,
      name: profile?.name ?? "Guest",
      email: profile?.email ?? user?.email ?? "",
      phone: profile?.phone ?? "",
      avatarUrl: profile?.avatarUrl ?? null,
      createdAt: profile?.createdAt ?? user?.created_at ?? null,
      signedIn: Boolean(user),
    }),
    [profile, user],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      user,
      account,
      profile,
      permissions,
      catalog,
      catalogLoading,
      propertyLookup,
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      bookings,
      addBooking,
      hostListings,
      hostBookings,
      refreshHostListings,
      refreshCatalog,
      updateProfile,
      hostApplication,
      requestHostVerification,
      currency,
      setCurrency,
      rates,
      altPrice,
      signOut,
    }),
    [
      ready,
      user,
      account,
      profile,
      permissions,
      catalog,
      catalogLoading,
      propertyLookup,
      favorites,
      toggleFavorite,
      bookings,
      addBooking,
      hostListings,
      hostBookings,
      refreshHostListings,
      refreshCatalog,
      updateProfile,
      hostApplication,
      requestHostVerification,
      currency,
      setCurrency,
      rates,
      altPrice,
      signOut,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNest() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useNest must be used inside NestStoreProvider");
  return ctx;
}

export type Filters = {
  category: CategoryId | "all";
  location: string;
  guests: number;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  minRating: number;
  amenities: string[];
  petFriendly: boolean;
};

export const defaultFilters: Filters = {
  category: "all",
  location: "",
  guests: 1,
  minPrice: 0,
  maxPrice: 10000,
  bedrooms: 0,
  bathrooms: 0,
  minRating: 0,
  amenities: [],
  petFriendly: false,
};

export const filterProperties = (list: Property[], f: Filters) =>
  list.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.location.trim()) {
      const q = f.location.trim().toLowerCase();
      const haystack = `${p.city} ${p.area} ${p.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (f.petFriendly && !p.petFriendly) return false;
    if (p.guests < f.guests) return false;
    if (p.price < f.minPrice || p.price > f.maxPrice) return false;
    if (p.bedrooms < f.bedrooms) return false;
    if (p.bathrooms < f.bathrooms) return false;
    if (p.rating < f.minRating) return false;
    if (f.amenities.length && !f.amenities.every((a) => (p.amenities as string[]).includes(a)))
      return false;
    return true;
  });
