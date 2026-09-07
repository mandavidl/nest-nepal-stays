import apartmentPokhara from "@/assets/prop-pokhara-apartment.jpg";
import cabinNagarkot from "@/assets/prop-nagarkot-cabin.jpg";
import homestayBandipur from "@/assets/prop-bandipur-homestay.jpg";
import hotelChitwan from "@/assets/prop-chitwan-hotel.jpg";
import houseKathmandu from "@/assets/prop-kathmandu-house.jpg";
import roomHetauda from "@/assets/prop-hetauda-room.jpg";
import hotelPokhara from "@/assets/prop-pokhara-hotel.jpg";

export type CategoryId = "homes" | "hotels" | "rooms" | "homestays" | "cottages";

export type Category = {
  id: CategoryId;
  emoji: string;
  label: string;
  short: string;
  blurb: string;
};

export const categories: Category[] = [
  {
    id: "homes",
    emoji: "🏠",
    label: "Homes & Apartments",
    short: "Homes",
    blurb: "Entire places with your own kitchen and door.",
  },
  {
    id: "hotels",
    emoji: "🏨",
    label: "Hotels",
    short: "Hotels",
    blurb: "Serviced rooms with daily housekeeping.",
  },
  {
    id: "rooms",
    emoji: "🛏",
    label: "Private Rooms",
    short: "Rooms",
    blurb: "Your own room inside a shared home.",
  },
  {
    id: "homestays",
    emoji: "🌿",
    label: "Homestays",
    short: "Homestays",
    blurb: "Stay with a local family, meals included.",
  },
  {
    id: "cottages",
    emoji: "🏕",
    label: "Cottages & Cabins",
    short: "Cottages",
    blurb: "Quiet standalone stays on the hillsides.",
  },
];

export const categoryById = (id: CategoryId) =>
  categories.find((c) => c.id === id) ?? categories[0];

export const amenityList = [
  "Wi-Fi",
  "Kitchen",
  "Parking",
  "Air conditioning",
  "Heating",
  "Washing machine",
  "Workspace",
] as const;

export type Amenity = (typeof amenityList)[number];

export const destinations = [
  { name: "Kathmandu", stays: 42 },
  { name: "Pokhara", stays: 58 },
  { name: "Chitwan", stays: 21 },
  { name: "Hetauda", stays: 14 },
  { name: "Nagarkot", stays: 18 },
  { name: "Bandipur", stays: 12 },
];

export type Review = {
  id: string;
  guest: string;
  initials: string;
  stayedOn: string;
  rating: number;
  text: string;
};

export type RatingBreakdown = {
  cleanliness: number;
  accuracy: number;
  location: number;
  checkIn: number;
  communication: number;
  value: number;
};

export type Property = {
  id: string;
  name: string;
  city: string;
  area: string;
  category: CategoryId;
  typeLabel: string;
  image: string;
  gallery: string[];
  price: number;
  cleaningFee: number;
  rating: number;
  reviewCount: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  guests: number;
  description: string;
  amenities: Amenity[];
  houseRules: string[];
  badges: string[];
  host: {
    name: string;
    initials: string;
    since: string;
    responseRate: number;
    verified: boolean;
  };
  ratingBreakdown: RatingBreakdown;
  reviews: Review[];
  bookedDays: number[];
};

const rb = (v: Partial<RatingBreakdown> = {}): RatingBreakdown => ({
  cleanliness: 4.8,
  accuracy: 4.7,
  location: 4.9,
  checkIn: 4.9,
  communication: 4.8,
  value: 4.7,
  ...v,
});

export const properties: Property[] = [
  {
    id: "mountain-view-apartment",
    name: "Mountain View Apartment",
    city: "Pokhara",
    area: "Lakeside, Ward 6",
    category: "homes",
    typeLabel: "Entire apartment",
    image: apartmentPokhara,
    gallery: [apartmentPokhara, hotelPokhara, houseKathmandu, cabinNagarkot],
    price: 3500,
    cleaningFee: 800,
    rating: 4.8,
    reviewCount: 124,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    guests: 4,
    description:
      "A bright, quiet apartment three minutes from Phewa Lake. Floor-to-ceiling windows frame the Annapurna ridge, and mornings start with sunlight across the living room. Full kitchen, fast Wi-Fi and a desk if you are working from Pokhara for a while.",
    amenities: ["Wi-Fi", "Kitchen", "Parking", "Heating", "Washing machine", "Workspace"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 11:00 AM",
      "No smoking indoors",
      "No parties or events",
      "Quiet hours after 10:00 PM",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos", "Verified Stay"],
    host: {
      name: "Anisha Gurung",
      initials: "AG",
      since: "2021",
      responseRate: 98,
      verified: true,
    },
    ratingBreakdown: rb({ cleanliness: 4.9, value: 4.8 }),
    reviews: [
      {
        id: "r1",
        guest: "Bikash Thapa",
        initials: "BT",
        stayedOn: "March 2026",
        rating: 5,
        text: "The lake view is exactly as shown. Anisha left instructions for everything and the kitchen had more than we needed.",
      },
      {
        id: "r2",
        guest: "Clara Meyer",
        initials: "CM",
        stayedOn: "February 2026",
        rating: 4.5,
        text: "Very clean and calm. Slight traffic noise in the evening but the mountain view made up for it.",
      },
    ],
    bookedDays: [8, 9, 10, 21, 22],
  },
  {
    id: "brickhouse-kathmandu",
    name: "Brickhouse Family Home",
    city: "Kathmandu",
    area: "Sanepa, Lalitpur",
    category: "homes",
    typeLabel: "Entire house",
    image: houseKathmandu,
    gallery: [houseKathmandu, apartmentPokhara, roomHetauda],
    price: 6200,
    cleaningFee: 1200,
    rating: 4.7,
    reviewCount: 96,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    guests: 6,
    description:
      "A double-height family home in quiet Sanepa with an exposed brick wall, a garden courtyard and a rooftop for evening tea. Walkable to cafés and a ten-minute ride to Patan Durbar Square.",
    amenities: ["Wi-Fi", "Kitchen", "Parking", "Air conditioning", "Washing machine", "Workspace"],
    houseRules: [
      "Check-in after 1:00 PM, check-out before 11:00 AM",
      "Pets allowed on request",
      "No smoking indoors",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos"],
    host: {
      name: "Sunil Shrestha",
      initials: "SS",
      since: "2019",
      responseRate: 95,
      verified: true,
    },
    ratingBreakdown: rb({ location: 4.6, accuracy: 4.8 }),
    reviews: [
      {
        id: "r1",
        guest: "Priya Sharma",
        initials: "PS",
        stayedOn: "January 2026",
        rating: 5,
        text: "Plenty of space for our family of five and parking inside the gate, which is rare in Kathmandu.",
      },
    ],
    bookedDays: [3, 4, 5, 6, 17],
  },
  {
    id: "lakeside-hotel-pokhara",
    name: "Phewa Stone Boutique Hotel",
    city: "Pokhara",
    area: "Baidam, Lakeside",
    category: "hotels",
    typeLabel: "Hotel room",
    image: hotelPokhara,
    gallery: [hotelPokhara, apartmentPokhara, cabinNagarkot],
    price: 5400,
    cleaningFee: 0,
    rating: 4.6,
    reviewCount: 212,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    guests: 2,
    description:
      "A stone-and-timber boutique hotel above the lake with a wide terrace for breakfast. Daily housekeeping, 24-hour reception and airport pickup on request.",
    amenities: ["Wi-Fi", "Parking", "Air conditioning", "Heating"],
    houseRules: [
      "Check-in after 12:00 PM, check-out before 11:00 AM",
      "Photo ID required at reception",
      "No smoking in rooms",
    ],
    badges: ["Verified Property", "Verified Photos", "Verified Stay"],
    host: {
      name: "Phewa Stone Hospitality",
      initials: "PH",
      since: "2018",
      responseRate: 99,
      verified: true,
    },
    ratingBreakdown: rb({ checkIn: 4.8, value: 4.4 }),
    reviews: [
      {
        id: "r1",
        guest: "Dawa Sherpa",
        initials: "DS",
        stayedOn: "April 2026",
        rating: 4.5,
        text: "Terrace breakfast with the mountains out front. Rooms are compact but spotless.",
      },
    ],
    bookedDays: [12, 13, 14],
  },
  {
    id: "jungle-lodge-chitwan",
    name: "Rapti Jungle Lodge",
    city: "Chitwan",
    area: "Sauraha",
    category: "hotels",
    typeLabel: "Lodge room",
    image: hotelChitwan,
    gallery: [hotelChitwan, homestayBandipur, hotelPokhara],
    price: 4800,
    cleaningFee: 0,
    rating: 4.9,
    reviewCount: 168,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    guests: 3,
    description:
      "Thatched-roof rooms with canopy beds and a private veranda facing the community forest. Mornings are loud with birds and nothing else.",
    amenities: ["Wi-Fi", "Parking", "Air conditioning"],
    houseRules: [
      "Check-in after 1:00 PM, check-out before 10:00 AM",
      "Keep verandah doors closed after dark",
      "No smoking indoors",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos", "Verified Stay"],
    host: {
      name: "Rapti Lodge Team",
      initials: "RL",
      since: "2017",
      responseRate: 97,
      verified: true,
    },
    ratingBreakdown: rb({ cleanliness: 4.9, location: 5, value: 4.8 }),
    reviews: [
      {
        id: "r1",
        guest: "Hannah Blake",
        initials: "HB",
        stayedOn: "December 2025",
        rating: 5,
        text: "Quietest sleep of our trip. Staff arranged everything and were very clear about pricing.",
      },
    ],
    bookedDays: [2, 19, 20, 21],
  },
  {
    id: "hetauda-private-room",
    name: "Hilltop Private Room",
    city: "Hetauda",
    area: "Bhutandevi",
    category: "rooms",
    typeLabel: "Private room in home",
    image: roomHetauda,
    gallery: [roomHetauda, houseKathmandu],
    price: 1600,
    cleaningFee: 300,
    rating: 4.5,
    reviewCount: 54,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    guests: 2,
    description:
      "A simple, tidy private room with a desk by the window and views over the Hetauda rooftops. Shared kitchen downstairs, private bathroom on your floor.",
    amenities: ["Wi-Fi", "Kitchen", "Parking", "Heating", "Workspace"],
    houseRules: [
      "Check-in after 3:00 PM, check-out before 10:00 AM",
      "Shared kitchen — please wash up after use",
      "No smoking anywhere on the property",
    ],
    badges: ["Verified Property", "Verified Host"],
    host: {
      name: "Kamala Rai",
      initials: "KR",
      since: "2022",
      responseRate: 92,
      verified: true,
    },
    ratingBreakdown: rb({ value: 4.9, cleanliness: 4.5 }),
    reviews: [
      {
        id: "r1",
        guest: "Rohit Karki",
        initials: "RK",
        stayedOn: "February 2026",
        rating: 4.5,
        text: "Great value for a work trip. Desk, strong Wi-Fi and Kamala's morning tea.",
      },
    ],
    bookedDays: [7, 8, 25],
  },
  {
    id: "bandipur-heritage-homestay",
    name: "Bandipur Heritage Homestay",
    city: "Bandipur",
    area: "Bazaar Street",
    category: "homestays",
    typeLabel: "Homestay room",
    image: homestayBandipur,
    gallery: [homestayBandipur, cabinNagarkot, roomHetauda],
    price: 2400,
    cleaningFee: 400,
    rating: 4.9,
    reviewCount: 87,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    guests: 4,
    description:
      "A restored Newari house on the car-free bazaar street, with carved windows, a brick courtyard and home-cooked dal bhat every evening with the family.",
    amenities: ["Wi-Fi", "Kitchen", "Heating"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 11:00 AM",
      "Dinner served at 7:30 PM with the family",
      "Please remove shoes in the courtyard",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos", "Verified Stay"],
    host: {
      name: "Maiya Pradhan",
      initials: "MP",
      since: "2020",
      responseRate: 100,
      verified: true,
    },
    ratingBreakdown: rb({ communication: 5, location: 5, cleanliness: 4.8 }),
    reviews: [
      {
        id: "r1",
        guest: "Tomás Reyes",
        initials: "TR",
        stayedOn: "March 2026",
        rating: 5,
        text: "Felt like being invited into a home, not booking a room. The dinner alone was worth the stay.",
      },
      {
        id: "r2",
        guest: "Sita Adhikari",
        initials: "SA",
        stayedOn: "November 2025",
        rating: 5,
        text: "Beautiful old house, warm family, spotless room. Bandipur is best without cars.",
      },
    ],
    bookedDays: [5, 6, 15, 16, 17],
  },
  {
    id: "nagarkot-sunrise-cabin",
    name: "Sunrise Ridge Cabin",
    city: "Nagarkot",
    area: "Ridge Road",
    category: "cottages",
    typeLabel: "Entire cabin",
    image: cabinNagarkot,
    gallery: [cabinNagarkot, homestayBandipur, hotelPokhara],
    price: 2800,
    cleaningFee: 600,
    rating: 4.9,
    reviewCount: 87,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    guests: 2,
    description:
      "A timber cabin on the ridge with a window aimed straight at the Himalaya. Wood-beam ceiling, thick blankets, a small stove and absolute quiet after dark.",
    amenities: ["Wi-Fi", "Kitchen", "Parking", "Heating"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 10:00 AM",
      "Two guests maximum",
      "No open fires outside the stove",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Stay"],
    host: {
      name: "Rajan Tamang",
      initials: "RT",
      since: "2021",
      responseRate: 96,
      verified: true,
    },
    ratingBreakdown: rb({ location: 5, cleanliness: 4.9 }),
    reviews: [
      {
        id: "r1",
        guest: "Meera Joshi",
        initials: "MJ",
        stayedOn: "January 2026",
        rating: 5,
        text: "Woke up to the whole range glowing pink from bed. Cold outside, very warm inside.",
      },
    ],
    bookedDays: [11, 12, 23, 24],
  },
  {
    id: "nagarkot-pine-cottage",
    name: "Pine Hollow Cottage",
    city: "Nagarkot",
    area: "Tauthali",
    category: "cottages",
    typeLabel: "Entire cottage",
    image: hotelPokhara,
    gallery: [hotelPokhara, cabinNagarkot, houseKathmandu],
    price: 4200,
    cleaningFee: 700,
    rating: 4.7,
    reviewCount: 61,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    guests: 5,
    description:
      "A larger cottage among the pines with a stone terrace, two bedrooms and a proper kitchen — built for families and slow weekends.",
    amenities: ["Wi-Fi", "Kitchen", "Parking", "Heating", "Washing machine"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 11:00 AM",
      "No parties or events",
      "Children welcome",
    ],
    badges: ["Verified Property", "Verified Photos"],
    host: {
      name: "Nabin Basnet",
      initials: "NB",
      since: "2023",
      responseRate: 90,
      verified: true,
    },
    ratingBreakdown: rb({ value: 4.6 }),
    reviews: [
      {
        id: "r1",
        guest: "Alok Bhandari",
        initials: "AB",
        stayedOn: "December 2025",
        rating: 4.5,
        text: "Roomy and warm, good for two families. The terrace at sunset is the best part.",
      },
    ],
    bookedDays: [1, 2, 27, 28],
  },
  {
    id: "kathmandu-thamel-room",
    name: "Courtyard Private Room",
    city: "Kathmandu",
    area: "Thamel North",
    category: "rooms",
    typeLabel: "Private room in apartment",
    image: roomHetauda,
    gallery: [roomHetauda, houseKathmandu, apartmentPokhara],
    price: 2100,
    cleaningFee: 350,
    rating: 4.4,
    reviewCount: 73,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    guests: 2,
    description:
      "A quiet room set back from the Thamel noise, off an inner courtyard. Good for a night before a trek — luggage storage included.",
    amenities: ["Wi-Fi", "Kitchen", "Air conditioning", "Workspace"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 10:00 AM",
      "Luggage storage free between stays",
      "No smoking indoors",
    ],
    badges: ["Verified Property", "Verified Host"],
    host: {
      name: "Deepa Maharjan",
      initials: "DM",
      since: "2022",
      responseRate: 94,
      verified: true,
    },
    ratingBreakdown: rb({ location: 4.7, value: 4.6, cleanliness: 4.3 }),
    reviews: [
      {
        id: "r1",
        guest: "Jonas Wirth",
        initials: "JW",
        stayedOn: "October 2025",
        rating: 4,
        text: "Simple and central. Quieter than expected for Thamel.",
      },
    ],
    bookedDays: [9, 10, 11],
  },
  {
    id: "chitwan-tharu-homestay",
    name: "Tharu Village Homestay",
    city: "Chitwan",
    area: "Bachhauli",
    category: "homestays",
    typeLabel: "Homestay room",
    image: homestayBandipur,
    gallery: [homestayBandipur, hotelChitwan],
    price: 1900,
    cleaningFee: 300,
    rating: 4.8,
    reviewCount: 45,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    guests: 3,
    description:
      "A mud-and-thatch Tharu family home at the edge of the buffer zone. Home-cooked meals, bicycles to borrow and a very early breakfast.",
    amenities: ["Wi-Fi", "Kitchen", "Parking"],
    houseRules: [
      "Check-in after 12:00 PM, check-out before 10:00 AM",
      "Meals included — tell the family about dietary needs",
      "No alcohol in the family courtyard",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Stay"],
    host: {
      name: "Bishnu Mahato",
      initials: "BM",
      since: "2023",
      responseRate: 93,
      verified: true,
    },
    ratingBreakdown: rb({ communication: 4.9, value: 5 }),
    reviews: [
      {
        id: "r1",
        guest: "Lucy Tan",
        initials: "LT",
        stayedOn: "February 2026",
        rating: 5,
        text: "Honest pricing, wonderful food, and the family made our kids feel at home.",
      },
    ],
    bookedDays: [14, 15],
  },
  {
    id: "hetauda-rental-home",
    name: "Makwanpur Rental Home",
    city: "Hetauda",
    area: "Nawalpur Road",
    category: "homes",
    typeLabel: "Entire house",
    image: houseKathmandu,
    gallery: [houseKathmandu, roomHetauda, hotelPokhara],
    price: 3900,
    cleaningFee: 700,
    rating: 4.6,
    reviewCount: 38,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    guests: 6,
    description:
      "A full house for longer stays in Hetauda, with a fenced garden, washing machine and covered parking for two vehicles.",
    amenities: [
      "Wi-Fi",
      "Kitchen",
      "Parking",
      "Air conditioning",
      "Heating",
      "Washing machine",
      "Workspace",
    ],
    houseRules: [
      "Check-in after 1:00 PM, check-out before 11:00 AM",
      "Minimum stay of two nights",
      "No smoking indoors",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos"],
    host: {
      name: "Gita Lamichhane",
      initials: "GL",
      since: "2020",
      responseRate: 91,
      verified: true,
    },
    ratingBreakdown: rb({ accuracy: 4.6, value: 4.8 }),
    reviews: [
      {
        id: "r1",
        guest: "Sagar Dhakal",
        initials: "SD",
        stayedOn: "March 2026",
        rating: 4.5,
        text: "Stayed two weeks for work. Everything worked, and the total was exactly what the listing said.",
      },
    ],
    bookedDays: [4, 18, 19],
  },
  {
    id: "pokhara-hotel-suite",
    name: "Annapurna View Hotel Suite",
    city: "Pokhara",
    area: "Sedi Height",
    category: "hotels",
    typeLabel: "Hotel suite",
    image: apartmentPokhara,
    gallery: [apartmentPokhara, hotelPokhara, cabinNagarkot],
    price: 7800,
    cleaningFee: 0,
    rating: 4.8,
    reviewCount: 134,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    guests: 3,
    description:
      "A corner suite above Sedi with a wall of glass facing the Annapurnas, a sitting area and breakfast on the roof terrace.",
    amenities: ["Wi-Fi", "Parking", "Air conditioning", "Heating", "Workspace"],
    houseRules: [
      "Check-in after 2:00 PM, check-out before 12:00 PM",
      "Photo ID required at reception",
      "No smoking in rooms",
    ],
    badges: ["Verified Property", "Verified Host", "Verified Photos", "Verified Stay"],
    host: {
      name: "Annapurna View Group",
      initials: "AV",
      since: "2016",
      responseRate: 99,
      verified: true,
    },
    ratingBreakdown: rb({ cleanliness: 4.9, checkIn: 4.9 }),
    reviews: [
      {
        id: "r1",
        guest: "Ishani Rana",
        initials: "IR",
        stayedOn: "January 2026",
        rating: 5,
        text: "Worth the price for the view alone. Breakfast on the terrace at 6am is unbeatable.",
      },
    ],
    bookedDays: [20, 21, 22, 23],
  },
];

export const SERVICE_FEE_RATE = 0.08;

export const formatNpr = (value: number) => `Rs. ${Math.round(value).toLocaleString("en-IN")}`;

export const nightsBetween = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.round(ms / 86400000);
  return nights > 0 ? nights : 0;
};

export type PriceBreakdown = {
  nights: number;
  nightly: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
};

export const quote = (property: Property, nights: number): PriceBreakdown => {
  const subtotal = property.price * nights;
  const cleaningFee = nights > 0 ? property.cleaningFee : 0;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return {
    nights,
    nightly: property.price,
    subtotal,
    cleaningFee,
    serviceFee,
    total: subtotal + cleaningFee + serviceFee,
  };
};

export const propertyById = (id: string) => properties.find((p) => p.id === id);

export const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
