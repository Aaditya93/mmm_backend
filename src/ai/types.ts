export interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export interface PackageData {
  title: string;
  keywords: string[];
  destination: string;
  isProcessed?: boolean;
  isLive?: boolean;
  days: number;
  nights: number;
  summary: string;
  startDate?: string | Date;
  endDate?: string | Date;
  locations: string[];
  activities: string[];
  highlights: string[];
  description: string;
  imageUrl: string[];
  travelers: { adults: number; children: number };
  audioSummary: string;
  summaryEmbedding?: number[];

  // Updated accommodation structure
  accommodation: {
    name: string;
    stars: number;
    roomType: string;
    details: string;
  }[];

  transportation: any[];
  itinerary: any[];

  // New fields for Flights and Visa
  flights?: {
    airline: string;
    flightNumber: string;
    dayNumber: number;

    departure: { city: string; dateTime: string | Date; time: string };
    arrival: { city: string; dateTime: string | Date; time: string };
    duration: string;
    stops: number;
    baggage: { checkInKg: number; cabinKg: number };
    price: number;
    currency: string;
  }[];
  priceData: {
    price: number;
    type: "Adult" | "Child";
    currency: string;
    details: string;
  }[];

  visa?: {
    price: number;
    currency: string;
    details: string;
    type: "Adult" | "Child";
  }[];

  inclusions: string[];
  exclusions: string[];
  audioUrl?: string;
  notes: string[];
  bookingDeadline: string | Date;

  defaultCurrency?: string;
}

export type ProgressCallback = (
  step: string,
  message: string,
  progress: number
) => void;
