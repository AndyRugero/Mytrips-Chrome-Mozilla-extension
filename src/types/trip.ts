export interface DiscountCode {
  id: string;
  code: string;
  merchant: string; // e.g. "Booking.com", "Trip.com", "CheapOair"
  domain: string; // e.g. "booking.com", "trip.com"
  discountText: string; // e.g. "10% OFF" or "$20 OFF"
  description: string;
  affiliateUrl: string;
  expiresAt?: string;
  isVerified: boolean;
}

export type BookingCategory = 'hotel' | 'flight' | 'activity' | 'car_rental';

export interface HotelBooking {
  id: string;
  name: string;
  checkInDate: string;
  checkOutDate: string;
  price: number;
  currency: string;
  location: string;
  bookingUrl: string;
  imageUrl?: string;
  discountCodeApplied?: string;
}

export interface FlightBooking {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  bookingUrl: string;
}

export interface ActivityBooking {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  currency: string;
  bookingUrl?: string;
}

export interface PackingItem {
  id: string;
  title: string;
  category: 'documents' | 'clothing' | 'electronics' | 'toiletries' | 'gear';
  isPacked: boolean;
  amazonAffiliateUrl?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetLimit: number;
  currency: string;
  coverImageUrl?: string;
  hotels: HotelBooking[];
  flights: FlightBooking[];
  activities: ActivityBooking[];
  packingList: PackingItem[];
  createdAt: string;
}

export interface ExtensionSettings {
  autoApplyDiscounts: boolean;
  preferredCurrency: string;
  partnerTagId: string;
  activeTripId: string | null;
}
