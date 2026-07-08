import { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  detail: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  location: string;
  photoUrl: string;
  favoriteTourIds: string[];
  addresses: UserAddress[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────
export type AdminRole = "super_admin" | "admin" | "editor" | "support";
export type AdminStatus = "active" | "suspended";

export interface Admin {
  id: string;
  displayName: string;
  email: string;
  role: AdminRole;
  partnerId?: string;
  status: AdminStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// PARTNERS
// ─────────────────────────────────────────────
export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  rating: number;
  reviewCount: number;
  totalTours: number;
  followerCount: number;
  location: string;
  verified: boolean;
  specialties: string[];
  brandColor: number;
  foundedYear: number;
  responseRate: string;
  phone: string;
  website: string;
}

// ─────────────────────────────────────────────
// TOURS
// ─────────────────────────────────────────────
export type TourStatus = "active" | "hidden" | "inactive";
export type TourRegion = "domestic" | "international";
export type TourType = "tour" | "experience" | "cuisine" | "shopping";

export interface TourItinerary {
  day: number;
  title: string;
  description: string;
}

export interface TourSchedule {
  date: string;
  price: number;
  departureCity: string;
  availableSlots: number;
  status: "available" | "full" | "soldout";
}

export interface Tour {
  id: string;
  name: string;
  destination: string;
  province: string;
  imageUrl: string;
  images?: string[];
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  duration: number;
  nights: number;
  departureSchedule: string;
  category: string;
  region: TourRegion;
  tourType: TourType;
  status: TourStatus;
  accommodation: string;
  isPopular: boolean;
  isFeatured: boolean;
  highlights: string[];
  description: string;
  includes: string[];
  excludes: string[];
  itinerary: TourItinerary[];
  departureCities: string[];
  schedules: TourSchedule[];
  partnerId: string;
  partnerName: string;
  partnerLogoUrl: string;
  partnerRating: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type LastMinuteTour = Tour;

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────
export type BookingType = "tour" | "hotel" | "flight" | "transfer";
export type BookingStatus =
  | "pending"
  | "upcoming"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  bookingType: BookingType;
  tourId: string;
  tourName: string;
  tourImage: string;
  destination: string;
  departureDate: Timestamp;
  returnDate?: Timestamp;
  adults: number;
  children?: number;
  totalPrice: number;
  accommodation?: string;
  status: BookingStatus;
  paymentDeadline?: Timestamp;
  departureCity?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Hotel extras
  checkInDate?: Timestamp;
  checkOutDate?: Timestamp;
  roomType?: string;
  guestsCount?: number;
  // Flight extras
  airlineName?: string;
  airlineLogo?: string;
  flightNumber?: string;
  flightClass?: string;
  passengerName?: string;
  // Transfer extras
  vehicleType?: string;
  pickUpTime?: string;
  flightCode?: string;
  pickUpLocation?: string;
  dropOffLocation?: string;
}

// ─────────────────────────────────────────────
// TOUR REVIEWS
// ─────────────────────────────────────────────
export interface TourReview {
  id: string;
  tourId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Timestamp;
}

// ─────────────────────────────────────────────
// HOTELS
// ─────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  originalPricePerNight: number;
  discountPercent: number;
  description: string;
  amenities: string[];
  stars: number;
}

// ─────────────────────────────────────────────
// FLIGHTS
// ─────────────────────────────────────────────
export interface Flight {
  id: string;
  airlineCode: string;
  airlineName: string;
  logoUrl: string;
  flightNumber: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  duration: string;
  luggageClass: string;
  flightType: "economy" | "business";
  dates: string[];
}

// ─────────────────────────────────────────────
// TRANSFERS
// ─────────────────────────────────────────────
export interface Transfer {
  id: string;
  airport: string;
  destination: string;
  imageUrl: string;
  price: number;
  vehicleType: "4-seater" | "7-seater" | "limousine";
  rating: number;
  supplierName: string;
  duration: string;
  description: string;
}

// ─────────────────────────────────────────────
// COMBOS
// ─────────────────────────────────────────────
export interface Combo {
  id: string;
  name: string;
  destination: string;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  duration: number;
  nights: number;
  description: string;
  highlights: string[];
  roomTypes: string[];
  policies: string[];
  partnerId: string;
  partnerName: string;
  partnerLogoUrl: string;
  partnerRating: number;
}

// ─────────────────────────────────────────────
// STATIC CONTENT
// ─────────────────────────────────────────────
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl: string;
  order: number;
}

export interface Destination {
  id: string;
  name: string;
  province: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  rank: number;
}

export interface Theme {
  id: string;
  label: string;
  tourCount: string;
  emoji: string;
  colorValue: number;
  order: number;
}

export interface Article {
  id: string;
  tag: string;
  title: string;
  readTime: string;
  imageUrl: string;
  order: number;
}

export interface Promo {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  action: string;
  gradientStart: number;
  gradientEnd: number;
  isCountdown: boolean;
  order: number;
}

export interface AppConfig {
  maintenanceMode: boolean;
  contactHotline: string;
  supportedCities: string[];
  minAppVersion: string;
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalTours: number;
  pendingBookings: number;
  revenueGrowth: number;
  bookingGrowth: number;
  userGrowth: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface BookingByTypeData {
  name: string;
  value: number;
  color: string;
}
