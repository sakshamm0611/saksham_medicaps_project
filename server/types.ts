export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export type MovieStatus = 'now-showing' | 'coming-soon';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  genres: string[];
  languages: string[];
  duration: number; // in minutes
  releaseDate: string; // ISO date string
  cast: string[];
  director: string;
  rating: number; // e.g. 8.9
  status: MovieStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Theatre {
  id: string;
  name: string;
  address: string;
  city: string;
  facilities: string[];
  screens: string[]; // Screen IDs
  createdAt: string;
  updatedAt: string;
}

export type SeatCategory = 'Silver' | 'Gold' | 'Premium';

export interface ScreenSeatBlueprint {
  row: string;
  col: number;
  seatNumber: string;
  category: SeatCategory;
  priceMultiplier: number;
}

export interface Screen {
  id: string;
  theatreId: string;
  screenName: string;
  supportedFormats: string[]; // e.g. ['2D', '3D', 'IMAX', '4DX']
  totalSeats: number;
  seatLayout: ScreenSeatBlueprint[];
  createdAt: string;
  updatedAt: string;
}

export type SeatStatus = 'available' | 'held' | 'booked';

export interface ShowSeat {
  seatNumber: string;
  row: string;
  col: number;
  category: SeatCategory;
  price: number;
  status: SeatStatus;
  heldBy?: string | null;
  heldUntil?: string | null; // ISO Date string
  bookingReference?: string | null;
}

export interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  showDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  format: string; // '2D' | '3D' | 'IMAX' | '4DX'
  basePrice: number;
  seats: ShowSeat[];
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface BookingSeatItem {
  seatNumber: string;
  category: SeatCategory;
  price: number;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  showId: string;
  seats: BookingSeatItem[];
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  bookingReference: string;
  provider: 'razorpay' | 'mock_simulator';
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
