'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type BookingData = {
  vehicleId: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  pickupLocation: string;
  addOns: string[];
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  rentalType?: string;
  withDriver?: boolean;
  includeCaution?: boolean;
  cautionAmount?: number;
};

type BookingContextType = {
  bookingData: BookingData;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>({
    vehicleId: null,
    pickupDate: null,
    returnDate: null,
    pickupLocation: '',
    addOns: [],
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    rentalType: 'day',
    withDriver: false,
    includeCaution: false,
    cautionAmount: 0,
  });
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <BookingContext.Provider value={{ bookingData, setBookingData, currentStep, setCurrentStep }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
