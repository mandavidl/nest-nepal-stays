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
};

export type HostListing = {
  property: Property;
  row: PropertyRow;
  photoUrls: Record<string, string>;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isHost: boolean;
};

type Account = { id: string | null; name: string; email: string; phone: string; signedIn: boolean };

type Store = {
  ready: boolean;
  user: User | null;
  account: Account;
  catalog: Property[];
  catalogLoading: boolean;
  propertyLookup: (id: string) => Property | undefined;
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<boolean>;
  bookings: Booking[];
  addBooking: (b: NewBooking) => Promise<Booking>;
  hostListings: HostListing[];
  refreshHostListings: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  updateProfile: (patch: { name?: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

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
});

export function NestStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hostListings, setHostListings] = useState<HostListing[]>([]);
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadProfile = useCallback(async (u: User) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone_number, is_host")
      .eq("id", u.id)
      .maybeSingle();
    setProfile({
      id: u.id,
      name: data?.full_name || (u.email?.split("@")[0] ?? "Guest"),
      email: data?.email || u.email || "",
      phone: data?.phone_number || "",
      isHost: Boolean(data?.is_host),
    });
  }, []);

  const loadFavorites = useCallback(async () => {
    const { data } = await supabase.from("favorites").select("property_id");
    setFavorites((data ?? []).map((f) => f.property_id));
  }, []);

  const loadBookings = useCallback(async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: false });
    setBookings((data ?? []).map((row) => mapBooking(row as Record<string, unknown>)));
  }, []);

  const refreshHostListings = useCallback(async () => {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as PropertyRow[];
    const urls = await signPhotoPaths([...new Set(rows.flatMap((r) => orderedPhotoPaths(r)))]);
    setHostListings(
      rows.map((row) => ({ row, photoUrls: urls, property: mapRowToProperty(row, urls) })),
    );
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("approval_status", "approved")
      .eq("status", "published")
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
        setFavorites([]);
        setBookings([]);
        setHostListings([]);
        setReady(true);
        return;
      }
      await Promise.all([
        loadProfile(nextUser),
        loadFavorites(),
        loadBookings(),
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

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, loadFavorites, loadBookings, refreshHostListings, refreshCatalog]);

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
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      const booking = mapBooking(data as Record<string, unknown>);
      setBookings((prev) => [booking, ...prev]);
      return booking;
    },
    [user],
  );

  const updateProfile = useCallback(
    async (patch: { name?: string; phone?: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(patch.name !== undefined ? { full_name: patch.name } : {}),
          ...(patch.phone !== undefined ? { phone_number: patch.phone } : {}),
        })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      setProfile((p) =>
        p ? { ...p, name: patch.name ?? p.name, phone: patch.phone ?? p.phone } : p,
      );
    },
    [user],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFavorites([]);
    setBookings([]);
    setHostListings([]);
  }, []);

  const account = useMemo<Account>(
    () => ({
      id: user?.id ?? null,
      name: profile?.name ?? "Guest",
      email: profile?.email ?? user?.email ?? "",
      phone: profile?.phone ?? "",
      signedIn: Boolean(user),
    }),
    [profile, user],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      user,
      account,
      catalog,
      catalogLoading,
      propertyLookup,
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      bookings,
      addBooking,
      hostListings,
      refreshHostListings,
      refreshCatalog,
      updateProfile,
      signOut,
    }),
    [
      ready,
      user,
      account,
      catalog,
      catalogLoading,
      propertyLookup,
      favorites,
      toggleFavorite,
      bookings,
      addBooking,
      hostListings,
      refreshHostListings,
      refreshCatalog,
      updateProfile,
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
