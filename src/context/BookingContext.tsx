import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface SelectedSeat {
  seatNumber: string;
  row: string;
  col: number;
  category: 'Silver' | 'Gold' | 'Premium';
  price: number;
}

export interface ShowDetails {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  showDate: string;
  startTime: string;
  endTime: string;
  format: string;
  basePrice: number;
  movie?: {
    id: string;
    title: string;
    posterUrl: string;
    duration: number;
    rating: number;
    genres: string[];
    languages: string[];
  };
  theatre?: {
    id: string;
    name: string;
    address: string;
    city: string;
    facilities: string[];
  };
  screen?: {
    id: string;
    screenName: string;
    supportedFormats: string[];
  };
}

interface BookingContextType {
  currentShow: ShowDetails | null;
  selectedSeats: SelectedSeat[];
  holdExpiresAt: string | null;
  pendingBookingRef: string | null;
  paymentOrder: any | null;
  setCurrentShow: (show: ShowDetails | null) => void;
  toggleSeat: (seat: SelectedSeat) => void;
  clearSelection: () => void;
  setHoldData: (expiresAt: string, bookingRef?: string, order?: any) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [currentShow, setCurrentShow] = useState<ShowDetails | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [pendingBookingRef, setPendingBookingRef] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);

  const toggleSeat = useCallback((seat: SelectedSeat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.seatNumber === seat.seatNumber);
      if (exists) {
        return prev.filter((s) => s.seatNumber !== seat.seatNumber);
      }
      if (prev.length >= 8) {
        return prev; // max 8 seats per checkout
      }
      return [...prev, seat];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
    setHoldExpiresAt(null);
  }, []);

  const setHoldData = useCallback((expiresAt: string, bookingRef?: string, order?: any) => {
    setHoldExpiresAt(expiresAt);
    if (bookingRef) setPendingBookingRef(bookingRef);
    if (order) setPaymentOrder(order);
  }, []);

  const resetBooking = useCallback(() => {
    setCurrentShow(null);
    setSelectedSeats([]);
    setHoldExpiresAt(null);
    setPendingBookingRef(null);
    setPaymentOrder(null);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        currentShow,
        selectedSeats,
        holdExpiresAt,
        pendingBookingRef,
        paymentOrder,
        setCurrentShow,
        toggleSeat,
        clearSelection,
        setHoldData,
        resetBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
