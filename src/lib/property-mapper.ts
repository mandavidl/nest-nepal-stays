import type { Amenity, CategoryId, Property, RatingBreakdown, Review } from "./nest-data";
import { categoryById } from "./nest-data";

export type PropertyRow = {
  id: string;
  host_id: string;
  property_name: string;
  property_category: string;
  type_label: string;
  city: string;
  area: string;
  address: string;
  description: string;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  house_rules: string[];
  badges: string[];
  phone_number: string;
  rating: number;
  review_count: number;
  rating_breakdown: unknown;
  reviews: unknown;
  booked_days: number[];
  photos: string[];
  cover_photo: string | null;
  pet_friendly: boolean;
  pet_types: string[];
  pet_rules: string | null;
  pet_fee: number;
  availability_from: string | null;
  cancellation_policy: string;
  approval_status: string;
  status: string;
  property_status: string;
  decision_note?: string | null;
  host_name: string;
  host_initials: string;
  host_since: string;
  host_response_rate: number;
  host_verified: boolean;
};

const defaultBreakdown: RatingBreakdown = {
  cleanliness: 0,
  accuracy: 0,
  location: 0,
  checkIn: 0,
  communication: 0,
  value: 0,
};

export const orderedPhotoPaths = (row: {
  photos: string[];
  cover_photo: string | null;
}): string[] => {
  const photos = row.photos.filter(Boolean);
  const cover = row.cover_photo;
  if (!cover) return photos;
  return [cover, ...photos.filter((p) => p !== cover)];
};

/** Maps a database listing row into the shared Property shape used across the UI. */
export const mapRowToProperty = (
  row: PropertyRow,
  urls: Record<string, string> = {},
): Property => {
  const paths = orderedPhotoPaths(row);
  const gallery = paths.map((p) => urls[p] ?? p).filter(Boolean);
  const category = (
    ["homes", "hotels", "rooms", "homestays", "cottages"].includes(row.property_category)
      ? row.property_category
      : "homes"
  ) as CategoryId;

  return {
    id: row.id,
    name: row.property_name,
    city: row.city,
    area: row.area,
    address: row.address,
    category,
    typeLabel: row.type_label || categoryById(category).label,
    image: gallery[0] ?? "",
    gallery,
    price: row.price_per_night,
    cleaningFee: row.cleaning_fee,
    rating: Number(row.rating) || 0,
    reviewCount: row.review_count,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    guests: row.max_guests,
    description: row.description,
    amenities: row.amenities as Amenity[],
    houseRules: row.house_rules,
    badges: row.badges,
    host: {
      id: row.host_id,
      name: row.host_name,
      initials: row.host_initials || row.host_name.slice(0, 2).toUpperCase(),
      since: row.host_since,
      responseRate: row.host_response_rate,
      verified: row.host_verified,
      phone: row.phone_number,
    },
    petFriendly: row.pet_friendly,
    petTypes: row.pet_types,
    petRules: row.pet_rules,
    petFee: row.pet_fee,
    cancellationPolicy: row.cancellation_policy,
    availabilityFrom: row.availability_from,
    approvalStatus:
      row.approval_status === "approved"
        ? "approved"
        : row.approval_status === "rejected"
          ? "rejected"
          : "pending",
    ratingBreakdown:
      row.rating_breakdown && typeof row.rating_breakdown === "object"
        ? { ...defaultBreakdown, ...(row.rating_breakdown as Partial<RatingBreakdown>) }
        : defaultBreakdown,
    reviews: Array.isArray(row.reviews) ? (row.reviews as Review[]) : [],
    bookedDays: row.booked_days ?? [],
  };
};
