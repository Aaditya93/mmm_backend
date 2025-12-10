/**
 * Package Model
 * @description Defines the Mongoose schema and model for a travel package entity.
 * @interface IPackage - TypeScript interface for the Package document structure.
 * @schema packageSchema - Mongoose schema enforcing data validation and structure.
 * @model Package - The compiled Mongoose model for interacting with the Package collection in MongoDB.
 * @returns {mongoose.Model<IPackage>} The Package model instance.
 */
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
  duration: string; // e.g. "12h 15m"
  layovers: {
    location: string;
    duration: string; // e.g. "2h 30m"
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
  flights?: IFlight[]; // <-- added flights array
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

// ...existing code...
const hotelStaySchema = new mongoose.Schema<IHotelStay>({
  place: { type: String },
  hotelName: { type: String },
  roomCategory: { type: String },
  nights: { type: Number },
  checkIn: { type: Date },
  checkOut: { type: Date },
  bookingNumber: { type: String },
  adults: { type: Number },
  children: { type: Number },
  mealPlan: { type: String },
});
// ...existing code...

const itinerarySchema = new mongoose.Schema<IItinerary>({
  day: { type: Number },
  title: { type: String },
  description: { type: String },
  meals: { type: [String] },
  activityDetails: { type: [{ name: String, description: String }] }, // new field
});

const accommodationSchema = new mongoose.Schema<IAccommodation>({
  name: { type: String },
  stars: { type: Number },
  roomType: { type: String },
  details: { type: String },
});

const transportationSchema = new mongoose.Schema<ITransportation>({
  type: { type: String },
  title: { type: String },
  vehicle: { type: String },
  details: { type: String },
  shared: { type: Boolean },
});

const flightSchema = new mongoose.Schema<IFlight>({
  airline: { type: String },
  flightNumber: { type: String },
  dayNumber: { type: Number },
  departure: {
    city: { type: String },

    dateTime: { type: Date },
    time: { type: String },
  },
  arrival: {
    city: { type: String },

    dateTime: { type: Date },
    time: { type: String },
  },
  duration: { type: String },
  layovers: [
    {
      location: { type: String },
      duration: { type: String },
    },
  ],

  baggage: {
    checkInKg: { type: Number },
    cabinKg: { type: Number },
  },
  price: { type: Number },
  currency: { type: String },
});

const travelersSchema = new mongoose.Schema<ITravelers>({
  adults: { type: Number },
  children: { type: Number },
});

const packageSchema = new mongoose.Schema<IPackage>(
  {
    title: { type: String },
    isLive: { type: Boolean, default: false },
    keywords: { type: [String] },
    days: { type: Number },
    nights: { type: Number },
    imageUrl: { type: [String] },
    audioUrl: { type: String },
    summary: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    locations: { type: [String] },
    activities: { type: [String] },
    highlights: { type: [String] },
    description: { type: String },
    travelers: { type: travelersSchema },
    audioSummary: { type: String },
    destination: { type: String },
    itinerary: { type: [itinerarySchema] },
    accommodation: { type: [accommodationSchema] },
    transportation: { type: [transportationSchema] },
    flights: { type: [flightSchema] }, // <-- added flights schema entry
    inclusions: { type: [String] },
    exclusions: { type: [String] },
    notes: { type: [String] },
    bookingDeadline: { type: Date },
    packageUrl: { type: String },
    isProcessed: { type: Boolean },
    hotelStays: { type: [hotelStaySchema] },
    hotelStaysLink: { type: String },
    priceData: [
      {
        price: { type: Number },
        type: { type: String, enum: ["Adult", "Child"] },
        currency: { type: String },
        details: { type: String },
      },
    ],

    price: {
      threeStar: { type: Number },
      fourStar: { type: Number },
      fiveStar: { type: Number },
      currency: { type: String },
    },
    currency: { type: String },
    visa: [
      {
        price: { type: Number },
        type: { type: String, enum: ["Adult", "Child"] },
        currency: { type: String },
        details: { type: String },
      },
    ],
    defaultCurrency: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Package: mongoose.Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", packageSchema);

export default Package;
