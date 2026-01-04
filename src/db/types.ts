import mongoose from "mongoose";

export interface IHotelStay {
  place: string;
  hotelName: string;
  roomCategory: string;
  nights: number;
  checkIn: Date;
  checkOut: Date;
  bookingNumber: string;
  adults: number;
  children: number;
  mealPlan: string;
}

export interface IItinerary {
  day: number;
  title: string;
  description: string;
  meals: string[];
  activityDetails: IActivity[];
}

export interface IAccommodation {
  name: string;
  stars: number;
  roomType: string;
  details: string;
}

export interface ITransportation {
  type: string;
  title: string;
  vehicle: string;
  details: string;
  shared: boolean;
}

export interface ITravelers {
  adults: number;
  children: number;
}

export interface IActivity {
  name: string;
  description: string;
}

export interface IFlight {
  airline: string;
  flightNumber: string;
  dayNumber: number;
  departure: {
    city: string;
    dateTime: Date | string;
    time: string;
  };
  arrival: {
    city: string;
    dateTime: Date | string;
    time: string;
  };
  duration: string;
  layovers: {
    location: string;
    duration: string;
  }[];
  baggage: {
    checkInKg: number;
    cabinKg: number;
  };
  price: number;
  currency: string;
}

export interface IPackage {
  _id: string;
  title: string;
  isLive: boolean;
  keywords: string[];
  days: number;
  nights: number;
  startDate: Date;
  endDate: Date;
  locations: string[];
  activities: string[];
  highlights: string[];
  description: string;
  travelers: ITravelers;
  audioSummary: string;
  destination: string;
  itinerary: IItinerary[];
  summary: string;
  accommodation: IAccommodation[];
  transportation: ITransportation[];
  flights?: IFlight[];
  inclusions: string[];
  exclusions: string[];
  notes: string[];
  bookingDeadline: Date;
  imageUrl: [string];
  audioUrl: string;
  hotelStays: IHotelStay[];
  hotelStaysLink: string;
  price: {
    threeStar: number;
    fourStar: number;
    fiveStar: number;
    currency: string;
  };
  currency: string;
  priceData: {
    price: number;
    type: "Adult" | "Child";
    currency: string;
    details: string;
  }[];
  visa: {
    price: number;
    currency: string;
    details: string;
    type: "Adult" | "Child";
  }[];
  defaultCurrency: string;
  packageUrl: string;
  isProcessed: boolean;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}
