import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  properties as seedProperties,
  quote,
  type CategoryId,
  type Property,
} from "./nest-data";

export type Booking = {
  id: string;
  propertyId: string;
  propertyName: string;
  city: string;
  typeLabel: string;
  image: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  hostName: string;
  status: "upcoming" | "completed";
  reviewed: boolean;
};

export type Listing = {
  id: string;
  name: string;
  category: CategoryId;
  address: string;
  city: string;
  description: string;
  price: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string;
  photoCount: number;
  availableFrom: string;
  status: "published" | "draft";
};

type Account = { name: string; email: string; signedIn: boolean };

type Store = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  bookings: Booking[];
  addBooking: (b: Omit<Booking, "id" | "status" | "reviewed">) => Booking;
  listings: Listing[];
  addListing: (l: Omit<Listing, "id">) => Listing;
  account: Account;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
};

const StoreContext = createContext<Store | null>(null);

const KEY = "nestnepal-state-v1";

const seedBookings = (): Booking[] => {
  const upcoming = seedProperties[5];
  const past = seedProperties[0];
  return [
    {
      id: "NN-4821",
      propertyId: upcoming.id,
      propertyName: upcoming.name,
      city: upcoming.city,
      typeLabel: upcoming.typeLabel,
      image: upcoming.image,
      checkIn: "2026-10-12",
      checkOut: "2026-10-15",
      guests: 2,
      nights: 3,
      total: quote(upcoming, 3).total,
      hostName: upcoming.host.name,
      status: "upcoming",
      reviewed: false,
    },
    {
      id: "NN-3947",
      propertyId: past.id,
      propertyName: past.name,
      city: past.city,
      typeLabel: past.typeLabel,
      image: past.image,
      checkIn: "2026-03-04",
      checkOut: "2026-03-08",
      guests: 4,
      nights: 4,
      total: quote(past, 4).total,
      hostName: past.host.name,
      status: "completed",
      reviewed: true,
    },
  ];
};

const seedListings = (): Listing[] =>
  [seedProperties[0], seedProperties[6]].map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    address: `${p.area}, ${p.city}`,
    city: p.city,
    description: p.description,
    price: p.price,
    guests: p.guests,
    bedrooms: p.bedrooms,
    beds: p.beds,
    bathrooms: p.bathrooms,
    amenities: p.amenities as string[],
    houseRules: p.houseRules.join("\n"),
    photoCount: p.gallery.length,
    availableFrom: "2026-09-15",
    status: "published" as const,
  }));

export function NestStoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [listings, setListings] = useState<Listing[]>(seedListings);
  const [account, setAccount] = useState<Account>({
    name: "Mandavi Dhakal",
    email: "mandavi@example.com",
    signedIn: true,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.favorites)) setFavorites(parsed.favorites);
      if (Array.isArray(parsed.bookings) && parsed.bookings.length) setBookings(parsed.bookings);
      if (Array.isArray(parsed.listings) && parsed.listings.length) setListings(parsed.listings);
      if (parsed.account) setAccount(parsed.account);
    } catch {
      /* ignore corrupt state */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ favorites, bookings, listings, account }));
    } catch {
      /* storage unavailable */
    }
  }, [favorites, bookings, listings, account]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const addBooking = useCallback((b: Omit<Booking, "id" | "status" | "reviewed">) => {
    const booking: Booking = {
      ...b,
      id: `NN-${Math.floor(1000 + Math.random() * 8999)}`,
      status: "upcoming",
      reviewed: false,
    };
    setBookings((prev) => [booking, ...prev]);
    return booking;
  }, []);

  const addListing = useCallback((l: Omit<Listing, "id">) => {
    const listing: Listing = { ...l, id: `listing-${Date.now()}` };
    setListings((prev) => [listing, ...prev]);
    return listing;
  }, []);

  const value = useMemo<Store>(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (id: string) => favorites.includes(id),
      bookings,
      addBooking,
      listings,
      addListing,
      account,
      signIn: (name, email) => setAccount({ name, email, signedIn: true }),
      signOut: () => setAccount((a) => ({ ...a, signedIn: false })),
    }),
    [favorites, toggleFavorite, bookings, addBooking, listings, addListing, account],
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
};

export const filterProperties = (list: Property[], f: Filters) =>
  list.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.location.trim()) {
      const q = f.location.trim().toLowerCase();
      const haystack = `${p.city} ${p.area} ${p.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (p.guests < f.guests) return false;
    if (p.price < f.minPrice || p.price > f.maxPrice) return false;
    if (p.bedrooms < f.bedrooms) return false;
    if (p.bathrooms < f.bathrooms) return false;
    if (p.rating < f.minRating) return false;
    if (f.amenities.length && !f.amenities.every((a) => (p.amenities as string[]).includes(a)))
      return false;
    return true;
  });
