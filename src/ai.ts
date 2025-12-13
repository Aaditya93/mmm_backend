import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import dbConnect from "./db/connection.js";
import Package from "./db/Package.js";
import { generateAudioSummary } from "./audio.js"; // Add this import
import { generateEmbedding } from "./embedding.js";

dotenv.config();

interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

interface PackageData {
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

// Initialize Gemini AI client
function initializeGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY environment variable is required"
    );
  }
  return new GoogleGenerativeAI(apiKey);
}
// Get generation configs
function getCreativeGenerationConfig(): GenerationConfig {
  return {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 40000,
  };
}

function getDeterministicGenerationConfig(): GenerationConfig {
  return {
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 40000,
  };
}

// Schema definitions

// 1. Marketing Schema
function getMarketingSchema(): any {
  return {
    type: "object",
    required: [
      "title",
      "keywords",
      "highlights",
      "description",
      "audioSummary",
      "summary",
      "activities",
      "locations",
    ],
    properties: {
      title: {
        type: "string",
        description:
          "Create an irresistible, SEO-optimized title that sparks wanderlust. Use power words like 'Ultimate', 'Exclusive', 'Breathtaking'. Include destination and unique selling points.",
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description:
          "SEO-focused keywords that travelers search for: destination names, activities, experiences, attractions.",
      },
      highlights: {
        type: "array",
        items: { type: "string" },
        description:
          "Irresistible selling points that create urgency and desire. Include exclusive experiences and luxury amenities.",
      },
      description: {
        type: "string",
        description:
          "Write a captivating 200+ word description that tells a story and paints a vivid picture. Start with an emotional hook, describe transformative experiences, and end with a compelling call-to-action.",
      },
      audioSummary: {
        type: "string",
        description:
          "A conversational audio script summarizing the package in simple words, alternating between Speaker 1 and Speaker 2, highlighting key attractions, activities, and experiences to engage listeners.",
      },
      summary: {
        type: "string",
        description:
          "Single sentence (<30 words) including: tour type (e.g. Family Adventure / Luxury Honeymoon / Cultural Explorer), duration (X days / Y nights), hotel category (e.g. 3-Star / Mixed 4–5-Star), destination, 1–2 top highlights. Optimized for semantic vector search.",
      },
      locations: {
        type: "array",
        items: { type: "string" },
        description:
          "Must-visit destinations that create excitement. Include iconic landmarks and hidden gems.",
      },
      activities: {
        type: "array",
        items: { type: "string" },
        description:
          "Compelling activities that differentiate this package. Focus on unique experiences and cultural immersions.",
      },
    },
  };
}

function getItinerarySchema(): any {
  return {
    type: "object",
    required: ["accommodation", "transportation"],
    properties: {
      accommodation: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "stars", "roomType", "details"],
          properties: {
            name: {
              type: "string",
              description: "Name of the hotel or accommodation package.",
            },
            stars: {
              type: "integer",
              description: "Star rating (e.g., 3, 4, 5).",
            },
            roomType: {
              type: "string",
              description: "Type of room (e.g., Deluxe, Suite, Twin Share).",
            },
            details: {
              type: "string",
              description: "Description of the accommodation.",
            },
          },
        },
      },
      transportation: {
        type: "array",
        items: {
          type: "object",
          required: ["type", "title", "vehicle", "details"],
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            vehicle: {
              type: "string",
              description:
                "Specify premium options or vehicle types like 'SUV', 'Sedan', 'Private Yacht'.",
            },
            details: {
              type: "string",
              description:
                "Highlight comfort features, scenic routes, and convenience.",
            },
            shared: {
              type: "boolean",
              description:
                "Indicates whether the transportation is shared or private. If shared, set to true; if private, set to false.",
            },
          },
        },
      },
    },
  };
}

// 2b. Daily Itinerary Schema (separate extraction)
function getDailyItinerarySchema(): any {
  return {
    type: "object",
    required: ["itinerary"],
    properties: {
      itinerary: {
        type: "array",
        items: {
          type: "object",
          required: ["day", "title", "description", "meals", "activityDetails"],
          properties: {
            day: { type: "integer" },
            title: { type: "string" },
            description: {
              type: "string",
              description:
                "Write immersive 100+ word descriptions for each day.",
            },
            meals: {
              type: "array",
              items: { type: "string" },
              description:
                "List of meals included for the day, e.g., ['Breakfast', 'Dinner'].",
            },
            activityDetails: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "description"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                    description:
                      "Activity name in Title Case (trimmed). Examples: 'Water Park', 'Temple Visit'.",
                    pattern: "^[A-Z][A-Za-z0-9'\\-\\s:,&()]+$",
                  },
                  description: {
                    type: "string",
                    minLength: 50,
                    maxLength: 600,
                    description:
                      "One paragraph (3-4 short sentences) describing what guests can expect. No markdown, no lists, no extra quoting. Keep concise.",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

// 3. Pricing Schema
function getPricingSchema(): any {
  return {
    type: "object",
    required: [
      "priceData",
      "days",
      "nights",
      "travelers",
      "inclusions",
      "exclusions",
      "notes",
    ],
    properties: {
      days: { type: "integer" },
      nights: { type: "integer" },
      startDate: {
        type: "string",
        pattern: "^\\d{2}-\\d{2}-\\d{4}$",
        description:
          "The start date of the package in DD-MM-YYYY format. If not available, use a placeholder or omit.",
      },
      endDate: {
        type: "string",
        pattern: "^\\d{2}-\\d{2}-\\d{4}$",
        description:
          "The end date of the package in DD-MM-YYYY format. If not available, use a placeholder or omit.",
      },
      bookingDeadline: {
        type: "string",
        pattern: "^\\d{2}/\\d{2}/\\d{4}$",
        description:
          "The deadline for booking the package, in MM/DD/YYYY format.",
      },
      travelers: {
        type: "object",
        properties: {
          adults: { type: "integer" },
          children: { type: "integer" },
        },
        description: "Number of adults and children in the travel package.",
      },
      priceData: {
        type: "array",
        description:
          "List of price entries. Each entry contains price, passenger type (Adult/Child), currency (ISO 4217) and optional details.",
        items: {
          type: "object",
          required: ["price", "type", "currency"],
          properties: {
            price: {
              type: "number",
              description: "Price amount for this passenger type",
            },
            type: {
              type: "string",
              enum: ["Adult", "Child"],
              description:
                "Passenger type for this price entry. If type is not specified, assume Adult.",
            },
            currency: {
              type: "string",
              description:
                "ISO 4217 three-letter currency code (e.g., USD, INR, EUR).",
            },
            details: {
              type: "string",
              description:
                "detials about the price entry (e.g., '1 bed extra', 'child under 5').",
            },
          },
        },
      },
      flights: {
        type: "array",
        description: "List of flight options found in the package.",
        items: {
          type: "object",
          properties: {
            airline: { type: "string" },
            flightNumber: { type: "string" },
            dayNumber: {
              type: "integer",
              description: "Day number of the flight in the itinerary.",
            },
            departure: {
              type: "object",
              properties: {
                city: { type: "string" },
                time: { type: "string" },
                date: { type: "string", description: "DD-MM-YYYY" },
              },
            },
            arrival: {
              type: "object",
              properties: {
                city: { type: "string" },
                time: { type: "string" },
                date: { type: "string", description: "DD-MM-YYYY" },
              },
            },
            duration: { type: "string" },
            layovers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  duration: { type: "string" },
                },
              },
            },
            baggage: {
              type: "object",
              properties: {
                checkInKg: { type: "integer" },
                cabinKg: { type: "integer" },
              },
            },
            price: { type: "number" },
            currency: { type: "string" },
          },
        },
      },
      visa: {
        type: "array",
        description: "Visa information and costs.",
        items: {
          type: "object",
          properties: {
            price: { type: "number" },
            currency: { type: "string" },
            details: { type: "string" },
            type: {
              type: "string",
              enum: ["Adult", "Child"],
              description: "If type is not specified, assume Adult.",
            },
          },
        },
      },
      inclusions: { type: "array", items: { type: "string" } },
      exclusions: { type: "array", items: { type: "string" } },
      notes: {
        type: "array",
        items: { type: "string" },
        description:
          "Important notes regarding the package. Don't mention visa related infomation.",
      },
    },
  };
}

// Prompt creation functions

function createMarketingPrompt(): string {
  return `
    Extract the creative marketing information for a travel package from the provided PDF.
    Focus on creating high-converting content.

    **JSON FORMATTING RULES (CRITICAL):**
    - Return ONLY valid JSON, no markdown code blocks
    - Use double quotes for all strings and property names
    - Escape special characters in strings: use \\n for newlines, \\" for quotes
    - NO trailing commas after the last item in arrays or objects
    - NO comments in the JSON

    **CRITICAL INSTRUCTIONS:**
    1.  **TITLE:** Create a magnetic, SEO-optimized title using power words.
    2.  **DESCRIPTION:** Write a captivating 200+ word story-driven description.
    3.  **HIGHLIGHTS:** Focus on unique, exclusive, and compelling experiences.
    4.  **KEYWORDS:** Include SEO-focused keywords for the destination and experiences.
    5.  **AUDIO SUMMARY:** Create a conversational audio script in simple words, alternating between Speaker 1 and Speaker 2.
    6.  **SUMMARY:** Write <30 words. Must include: tour type, duration, hotel category, destination name, and 1–2 signature highlights.
    7.  **LOCATIONS & ACTIVITIES:** List all locations visited and activities performed. list only top 10-15 activities. Focus on unique experiences and local culture. Get All the locations and activities from the pdf.

    **WRITING TONE:** Enthusiastic, sophisticated, and emotionally engaging.
    
    **STRICTLY ADHERE** to the JSON schema.
     **EXAMPLE OUTPUT:**
    \`\`\`json
    {
      "title": "6-Day Enchanting Bali Family Adventure: Temples, Beaches & Nusa Penida Wonders",
      "keywords": [
        "Bali",
        "Family Travel",
        "Temples",
        "Beaches",
        "Nusa Penida",
        "Cultural Tour",
        "Adventure Holiday",
        "Waterfalls",
        "Volcano",
        "Gate of Heaven"
      ],
      "highlights": [
        "Discover the majestic Lempuyang Temple, the 'Gates of Heaven', and capture iconic photographs.",
        "Experience the thrill of watersports at Tanjung Benoa beach, including a fun banana boat ride.",
        "Explore the stunning Nusa Penida, including Kelingking Beach, Broken Beach, Angel Billabong and Crystal Bay",
        "Witness the beautiful Tegenungan Waterfall"
      ],
      "description": "Embark on an unforgettable 6-day family adventure in Bali, a paradise where ancient traditions meet stunning landscapes. This meticulously planned itinerary is designed to immerse you in the heart of Balinese culture, natural beauty, and thrilling experiences. Begin your journey with a visit to Tegenungan Waterfall, and the Kintamani volcano view point, followed by exploring the Alas Harum Bali Swing. Discover the iconic 'Gates of Heaven' at Lempuyang Temple. Feel the thrill of Tanjung Benoa beach with exciting watersports. Adventure to the breathtaking island of Nusa Penida, and explore the stunning Kelingking Beach, Broken Beach, Angel Billabong, and Crystal Bay. This enchanting escape promises cherished memories for the whole family.",
      "audioSummary": "Speaker 1: Welcome to your Unforgettable 6-Day Bali Family Escape! Get ready to experience the perfect mix of adventure, relaxation, and culture on one of the world's most beautiful islands.\\nSpeaker 2: Picture this — waterfalls, temples, tropical beaches, and those stunning Bali sunsets. Sounds magical already, right?\\nSpeaker 1: Your journey begins the moment you arrive at Bali Airport, where you'll be greeted with a warm smile and taken straight to your cozy hotel.\\nSpeaker 2: The next day, it's time for adventure! Visit the breathtaking Tegenungan Waterfall and enjoy spectacular views of the Kintamani Volcano.\\nSpeaker 1: You'll also explore Ubud Palace and take that famous jungle swing at Alas Harum — a perfect spot for family photos!\\nSpeaker 2: Then comes a day of fun in the sun at Tanjung Benoa Beach, where you'll enjoy thrilling watersports, including a banana boat ride.\\nSpeaker 1: Don't miss the sunset at Uluwatu Temple — it's truly one of Bali's most magical moments.\\nSpeaker 2: On day four, step into Bali's spiritual side with a visit to the Lempuyang Temple, known as the Gates of Heaven, followed by the serene Tirta Gangga Water Palace.\\nSpeaker 1: And just when you think it can't get any better — you'll sail to Nusa Penida Island!\\nSpeaker 2: Explore Kelingking Beach, Broken Beach, Angel Billabong, and Crystal Bay — four breathtaking spots that define paradise.\\nSpeaker 1: As your journey comes to an end, you'll enjoy one last breakfast before heading home, carrying memories of Bali's beauty, culture, and warmth.\\nSpeaker 2: Six days of family fun, island adventure, and unforgettable moments — this is your Bali Family Escape.\\nSpeaker 1: Ready to experience it? Let Bali welcome you with open arms. 🌴",
      "summary": "6-day Bali Family Adventure with temples, waterfalls, Nusa Penida island tour, cultural experiences, and stunning volcano views. 3-Star hotels ideal for families. Affordable and fun.",
       "locations": ["Ubud", "Tanjung Benoa", "Uluwatu", "Nusa Penida", "Lempuyang"],
      "activities": [
        "Cultural Exploration",
        "Beach Hopping",
        "Watersports",
        "Scenic Sightseeing",
        "Waterfall Visit",
        "Volcano View",3
        "Island Tour"
      ],
    }
    \`\`\`
    Return only valid JSON without additional text or formatting.
  `;
}

function createItineraryPrompt(): string {
  return `
    Extract the accommodation and transportation information from the provided PDF.
    Focus on the structured details of the trip.
     **JSON FORMATTING RULES (CRITICAL):**
    - Return ONLY valid JSON, no markdown code blocks
    - Use double quotes for all strings and property names
    - Escape special characters in strings: use \\n for newlines, \\" for quotes
    - NO trailing commas after the last item in arrays or objects
    - NO comments in the JSON

    **CRITICAL INSTRUCTIONS:**
    1.  **ACCOMMODATION:** Extract accommodation details (name, stars, roomType, details). Don't repeat hotel info if same for multiple nights.
    2.  **TRANSPORTATION:** Extract transportation entries found in the PDF. The PDF may contain a table with columns like DAY / BRIEF ITINERARY / HOTEL / MEAL / NOTE / GUIDE. When a "NOTE" column contains PRV, PVT or PVT (private) mark shared: false. When it contains SIC mark shared: true. If NOTE is '-' or missing, default to shared: false. Map common wording in itinerary or brief itinerary column to vehicle types using these rules (case-insensitive):
      For each transportation item include: { type, title, vehicle, details, shared }.
      Get All the transportation entries from the pdf. Note it is  neessary to get all the transportation entries from the pdf.
      When the PDF uses abbreviations PRV/PVT/SIC, decode them exactly: PRV/PVT -> shared: false, SIC -> shared: true.
      Focus more On SIC vs PVT/PRV for shared field rather than vehicle type. 
   

    **WRITING TONE:** Clear, accurate, and informative.
    
    **STRICTLY ADHERE** to the JSON schema.
      **EXAMPLE OUTPUT:**

    {
     "accommodation": [
    {
      "name": "Solaris Kuta",
      "stars": 3,
      "roomType": "Deluxe Room",
      "details": "Stay at the Solaris Kuta 3* - Deluxe Room. Rate is per person on twin sharing basis. Hotel centrally located with comfortable rooms and pool access."
    },
    {
      "name": "Ubud Serenity Resort",
      "stars": 4,
      "roomType": "Garden Suite",
      "details": "4-star resort with private garden suites, daily breakfast included, and complimentary shuttle to Ubud center."
    }
  ],
   
      "transportation": [
        {
          "type": "transfer",
          "title": "Airport to Hotel Transfer",
          "vehicle": "Private Car",
          "shared": false,
          "details": "Arrival at Bali airport meet and greet by OUR REPRESENTATIVE then transfer to the hotel."
        },
        {
          "type": "transfer",
          "title": "Phu Quoc Arrival – Grand World",
          "vehicle": "4 Seater car",
          "shared": true,
          "details": "Upon arrival at Phu Quoc airport, you will be welcomed by our representative and transferred to Grand World for exploration and leisure activities."
        }
      ]
      
    }
    \`\`\`
    Return only valid JSON without additional text or formatting.
  `;
}

function createDailyItineraryPrompt(): string {
  return `
    Extract the daily itinerary information from the provided PDF.
    Focus on the day-by-day activities and descriptions.
     **JSON FORMATTING RULES (CRITICAL):**
    - Return ONLY valid JSON, no markdown code blocks
    - Use double quotes for all strings and property names
    - Escape special characters in strings: use \\n for newlines, \\" for quotes
    - NO trailing commas after the last item in arrays or objects
    - NO comments in the JSON

    **CRITICAL INSTRUCTIONS:**
    1.  **ITINERARY:** For each day, provide a detailed 100+ word description, meals, and activities. Extract main daily events (tours, attractions, parks, temple visits, safaris, etc.), skipping non‑main/operational items (leisure, free time, meals, transfers, flights). For each activity return a 3–4 line paragraph, with Title Case trimmed names kept in the itinerary's original order.

    **WRITING TONE:** Clear, accurate, and informative.
    
    **STRICTLY ADHERE** to the JSON schema.
      **EXAMPLE OUTPUT:**

    {
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival in Bali",
          "description": "Upon arrival at Bali airport, you will be greeted by our representative. You will then be transferred to your hotel to settle in and relax after your journey. The remainder of the day is at your leisure, allowing you to explore the immediate surroundings of your accommodation or simply unwind and prepare for the adventures that await you in the coming days. This initial transfer ensures a smooth start to your Bali experience, offering a comfortable and hassle-free transition to your chosen hotel.",
          "meals": [],
          "activityDetails": [
            {
              "name": "Bai Dinh Pagoda Visit",
              "description": "Visit the sprawling Bai Dinh Pagoda complex, one of Southeast Asia's largest Buddhist sites. Wander among hundreds of ornate statues and step inside the impressive halls to learn about local spiritual traditions. Take time to enjoy panoramic views from the temple terraces and observe the peaceful monastic atmosphere."
            },
            {
              "name": "Cycling in Trang An Village",
              "description": "Cycle gentle lanes through rice paddies and riverside villages to experience authentic rural life. Pause to see traditional homes, local farmers at work, and scenic limestone karst backdrops. The easy-paced route is family-friendly and ideal for photography and casual exploration."
            }
          ]
        },
        {
          "day": 2,
          "title": "Tegenungan Waterfall & Kintamani Tour",
          "description": "Embark on a full-day tour that begins with a visit to the majestic Tegenungan Waterfall, where you can marvel at the cascading waters and lush surroundings. Next, journey to Kintamani, renowned for its breathtaking volcano views. Immerse yourself in the world of coffee at an Agrotourism plantation, followed by an exhilarating experience at Alas Harum Bali Swing. Explore the historical Ubud Palace and delve into the artistic heritage of Celuk Mas village. Conclude your day with a visit to Bidadari Batik, where you can admire and purchase traditional Balinese textiles.",
          "meals": ["Breakfast"],
          "activityDetails": [
            {
              "name": "Tegenungan Waterfall Visit",
              "description": "Marvel at the lush surroundings and thundering cascade of Tegenungan Waterfall, with time for photos and short walks along the viewing areas. Enjoy the refreshing mist and vantage points that highlight the waterfall's dramatic drop. The site offers easy access and short walking paths suitable for most travelers."
            }
          ]
        }
      ]
    }
    \`\`\`
    Return only valid JSON without additional text or formatting.
  `;
}

function createPricingPrompt(): string {
  return `
    Extract the pricing, dates, and flight information from the provided PDF.
    
     **JSON FORMATTING RULES (CRITICAL):**
    - Return ONLY valid JSON, no markdown code blocks
    - Use double quotes for all strings and property names
    - Escape special characters in strings: use \\n for newlines, \\" for quotes
    - NO trailing commas after the last item in arrays or objects
    - NO comments in the JSON

    **CRITICAL INSTRUCTIONS:**
     1.  **PRICING:** Extract the available price information for Adult and Child. EVERY price entry must include a \"type\" field.
        - If the source text does NOT explicitly indicate a child fare (words like: child, children, kid, kids, infant, toddler, "below X years", "under X years", "child with bed"), you MUST set \"type\": \"Adult\" (default to Adult when ambiguous).
        - Only set \"type\": \"Child\" when the PDF text clearly indicates a child-specific price.
        - Preserve any qualifier in \"details\" (e.g., age ranges, bed info).
        - **CURRENCY:** Use ONLY ISO 4217 three-letter currency codes.
    2.  **DATES:** Extract start date, end date (DD-MM-YYYY) and booking deadline (MM/DD/YYYY).
    3.  **DURATION:** Extract days and nights.
    4.  **TRAVELERS:** Extract the number of adults and children.
    5.  **FLIGHTS:** Extract flight details including airline, numbers, times, baggage, layovers, price,currency. Only add flights that are explicitly mentioned in the PDF. There is all the flight related information in the pdf.
    6.  **VISA:** Extract visa costs and details. if type is not specified, assume Adult.
    7.  **INCLUSIONS/EXCLUSIONS/NOTES:** List all items clearly.

    **STRICTLY ADHERE** to the JSON schema.
      **EXAMPLE OUTPUT:**
    \`\`\`json
    {
     "priceData": [
        {
          "price": 1200,
          "type": "Adult",
          "currency": "USD",
          "details": "Per person on twin sharing basis"
        },
        {
          "price": 800,
          "type": "Child",
          "currency": "USD",
          "details": "Child with bed"
        }
      ],
       "travelers": {
        "adults": 5,
        "children": 2
      },
       "days": 6,
      "nights": 5,
      "startDate": "05-11-2024",
      "endDate": "10-11-2024",
      "flights": [
        {
          "airline": "Garuda Indonesia",
          "flightNumber": "GA881",
          "dayNumber": 1,
          "departure": {
            "city": "Tokyo",
            "time": "11:00",
            "date": "05-11-2024"
          },
          "arrival": {
            "city": "Denpasar",
            "time": "17:30",
            "date": "05-11-2024"
          },
          "duration": "7h 30m",
          "layovers": [
            {
              "location": "Osaka",
              "duration": "2h 0m"
              }]
          "baggage": {
            "checkInKg": 30,
            "cabinKg": 7
          },
          "price": 500,
          "currency": "USD"
        }
      ],
      "visa": [
        {
          "price": 35,
          "currency": "USD",
          "details": "Visa on Arrival (VoA) for 30 days, extendable once.",
          "type": "Adult"
        }
      ],
      "inclusions": [
        
        "Transportation use: 4 Seater car",
        "1 bottle of mineral water 600ml on arrival day, 2 bottles of mineral water 600ml during tour"
      ],
      "exclusions": [
        "Airline ticket",
        "Tipping for driver and tour guide",
        "Personal expenses and other expenses which are not stated in the program"
      ],
      "notes": [
        "Prices are subject to change based on availability and seasonality.",
        "Visa fees may vary based on nationality and are subject to change."
      ]
     
    }
    \`\`\`
    Return only valid JSON without additional text or formatting.
  `;
}

// Execute extraction
async function executeExtraction(
  pdfBuffer: Buffer,
  prompt: string,
  generationConfig: GenerationConfig,
  schema?: any
): Promise<[any]> {
  const genAI = initializeGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const genOptions: any = {
    temperature: generationConfig.temperature,
    topP: generationConfig.topP,
    topK: generationConfig.topK,
    maxOutputTokens: generationConfig.maxOutputTokens,
    responseMimeType: "application/json",
  };

  if (schema) {
    genOptions.responseSchema = schema;
  }

  const result = await model.generateContent(
    [
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      prompt,
    ],
    genOptions
  );
  console.log("tokekn usage:", result.response.usageMetadata?.totalTokenCount);

  // Parse JSON response
  let responseText = result.response.text();
  responseText = responseText.trim();

  if (responseText.startsWith("```json")) {
    responseText = responseText
      .replace("```json", "")
      .replace("```", "")
      .trim();
  } else if (responseText.startsWith("```")) {
    responseText = responseText.replace("```", "").trim();
  }

  const parsed = JSON.parse(responseText);
  return [parsed];
}

// Update the main extraction function to use the calculation function
export async function extractPackageData(pdfPath: string): Promise<{
  data: PackageData;
}> {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Task 1, 2 & 3: Run extractions in parallel
    const marketingPrompt = createMarketingPrompt();
    const itineraryPrompt = createItineraryPrompt();
    const pricingPrompt = createPricingPrompt();

    const [[marketingData], [itineraryData], [pricingData]] = await Promise.all(
      [
        executeExtraction(
          pdfBuffer,
          marketingPrompt,
          getCreativeGenerationConfig(),
          getMarketingSchema()
        ),
        executeExtraction(
          pdfBuffer,
          itineraryPrompt,
          getDeterministicGenerationConfig(),
          getItinerarySchema()
        ),
        executeExtraction(
          pdfBuffer,
          pricingPrompt,
          getDeterministicGenerationConfig(),
          getPricingSchema()
        ),
      ]
    );

    // Merge the results from all tasks
    const combinedData: PackageData = {
      ...marketingData,
      ...itineraryData,
      ...pricingData,
      defaultCurrency: "INR",
    };

    return { data: combinedData };
  } catch (error) {
    throw new Error();
  }
}

// Save package data to JSON file
export function savePackageData(
  packageData: PackageData,
  outputPath: string
): void {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(packageData, null, 2), "utf-8");
    console.log(`Package data saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to save package data: ${error}`);
  }
}

// Save package data to MongoDB
export async function savePackageToDb(
  packageId: string,
  packageData: PackageData
): Promise<void> {
  try {
    // Convert date strings to Date objects
    const convertedData: any = { ...packageData };
    if (convertedData.startDate) {
      const [day, month, year] = convertedData.startDate.split("-").map(Number);
      convertedData.startDate = new Date(year, month - 1, day);
    }
    if (convertedData.endDate) {
      const [day, month, year] = convertedData.endDate.split("-").map(Number);
      convertedData.endDate = new Date(year, month - 1, day);
    }
    if (convertedData.bookingDeadline) {
      const [month, day, year] = convertedData.bookingDeadline
        .split("/")
        .map(Number);
      convertedData.bookingDeadline = new Date(year, month - 1, day);
    }

    // Handle flight dates
    if (convertedData.flights) {
      convertedData.flights = convertedData.flights.map((flight: any) => {
        if (flight.departure?.date) {
          const [day, month, year] = flight.departure.date
            .split("-")
            .map(Number);
          flight.departure.dateTime = new Date(year, month - 1, day);
        }
        if (flight.arrival?.date) {
          const [day, month, year] = flight.arrival.date.split("-").map(Number);
          flight.arrival.dateTime = new Date(year, month - 1, day);
        }
        return flight;
      });
    }

    await dbConnect();
    const res = await Package.findByIdAndUpdate(packageId, convertedData, {
      upsert: true,
    });
    console.log("MongoDB upsert result:", res);
    console.log(`Package data saved to MongoDB for: ${packageData.title}`);
  } catch (error) {
    console.error("Error saving package to DB:", error);
    throw new Error(`Failed to save package to DB: ${error}`);
  }
}

/**
 * Download helper from provided peScript
 */
async function downloadToTempFile(
  url: string
): Promise<{ filePath: string; mimeType: string }> {
  try {
    const response = await axios.get(url, { responseType: "stream" });

    // Determine extension and mime type
    const isDocx = url.endsWith(".docx") || url.endsWith(".doc");
    const extension = isDocx ? ".docx" : ".pdf";
    const mimeType = isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    // Create temp path
    const tempFilePath = path.join(
      os.tmpdir(),
      `pkg_${Date.now()}${extension}`
    );
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve({ filePath: tempFilePath, mimeType }));
      writer.on("error", reject);
    });
  } catch (error) {
    throw new Error(`Failed to download file: ${error}`);
  }
}

// Process a single PDF file
export async function processPackagePdf(
  packageId: string,
  pdfPath: string,
  destination: string
): Promise<PackageData> {
  let localPath = pdfPath;
  let downloadedTemp = false;

  const { filePath } = await downloadToTempFile(pdfPath);
  localPath = filePath;
  downloadedTemp = true;

  if (!fs.existsSync(localPath)) {
    throw new Error(`PDF file not found: ${localPath}`);
  }

  const startTime = performance.now();
  console.log(`\nProcessing PDF: ${path.basename(localPath)}`);

  try {
    const { data: packageData } = await extractPackageData(localPath);
    packageData.destination = destination;
    packageData.isProcessed = true;
    packageData.isLive = false;

    // Generate embedding (summary/audioSummary/description) and attach to packageData
    try {
      const textToEmbed =
        packageData.summary && String(packageData.summary).trim();
      if (textToEmbed) {
        console.log("Generating embedding...");
        const embedding = await generateEmbedding(textToEmbed);
        // attach embedding to package data (field name: summaryEmbedding)
        (packageData as any).summaryEmbedding = embedding;
        console.log("Embedding generated. Vector length:", embedding.length);
      }
    } catch (embedError) {
      console.error("Failed to generate embedding:", embedError);
      // Continue without embedding
    }

    // Generate audio from audioSummary
    try {
      if (packageData.audioSummary) {
        console.log("Generating audio summary...");
        const audioResult = await generateAudioSummary(
          packageData.audioSummary
        );

        // Add the audio URL to package data
        packageData.audioUrl = audioResult.audioUrl;

        console.log(
          `Audio generated and uploaded. URL: ${audioResult.audioUrl}`
        );
        console.log(
          `Audio generation cost: $${audioResult.cost.totalCost.toFixed(4)}`
        );
      }
    } catch (audioError) {
      console.error("Failed to generate audio summary:", audioError);
      // Continue without audio URL
    }

    // Ensure imageUrl array with 3 unique images based on destination
    try {
      const baseImgUrl =
        "https://travel-images1234.s3.ap-south-1.amazonaws.com";
      const rawDest = destination;
      // Normalize destination folder/name (remove extra spaces, keep capitalization)
      const dest = rawDest;
      const images: string[] = [];
      const used = new Set<number>();
      while (images.length < 3) {
        // generate unique numbers in range 1..25 (inclusive)
        const n = Math.floor(Math.random() * 25) + 1; // 1..25
        if (used.has(n)) continue;
        used.add(n);
        images.push(`${baseImgUrl}/${dest}/${dest}_${n}.webp`);
      }
      packageData.imageUrl = images;
      console.log("Generated imageUrl array:", images);
    } catch (imgErr) {
      console.warn("Failed to generate imageUrl array:", imgErr);
    }

    console.log("Saving package data to database...");
    console.log(packageData);
    savePackageData(
      packageData,
      "output_" + path.basename(localPath, path.extname(localPath)) + ".json"
    );
    await savePackageToDb(packageId, packageData);

    const elapsed = (performance.now() - startTime) / 1000;
    console.log(
      `Total time for processing '${path.basename(
        localPath
      )}': ${elapsed.toFixed(2)} seconds`
    );

    return packageData;
  } finally {
    // cleanup downloaded temp file if created
    try {
      if (downloadedTemp && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`Deleted temp file: ${localPath}`);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to delete temp file ${localPath}:`, cleanupErr);
    }
  }
}

// Type for progress callback
type ProgressCallback = (
  step: string,
  message: string,
  progress: number
) => void;

// Process a single PDF file with progress updates
// Process a single PDF file with progress updates
export async function processPackagePdfWithProgress(
  packageId: string,
  pdfPath: string,
  destination: string,
  onProgress: ProgressCallback
): Promise<PackageData> {
  let localPath = pdfPath;
  let downloadedTemp = false;

  onProgress("download", "Downloading PDF file...", 5);
  const { filePath } = await downloadToTempFile(pdfPath);
  localPath = filePath;
  downloadedTemp = true;

  if (!fs.existsSync(localPath)) {
    throw new Error(`PDF file not found: ${localPath}`);
  }

  const startTime = performance.now();
  console.log(`\nProcessing PDF: ${path.basename(localPath)}`);
  onProgress("download", "PDF downloaded successfully", 10);

  try {
    onProgress("extraction", "Extracting package data from PDF...", 15);

    const pdfBuffer = fs.readFileSync(localPath);

    // Run extractions in parallel with individual progress updates
    const marketingPrompt = createMarketingPrompt();
    const itineraryPrompt = createItineraryPrompt();
    const dailyItineraryPrompt = createDailyItineraryPrompt();
    const pricingPrompt = createPricingPrompt();

    onProgress(
      "extraction",
      "Running AI extraction (Marketing, Itinerary, Daily Itinerary, Pricing)...",
      20
    );

    const [
      marketingResult,
      itineraryResult,
      dailyItineraryResult,
      pricingResult,
    ] = await Promise.all([
      executeExtraction(
        pdfBuffer,
        marketingPrompt,
        getCreativeGenerationConfig(),
        getMarketingSchema()
      ).then((result) => {
        onProgress("marketing", "Marketing data extracted", 30);
        return result;
      }),
      executeExtraction(
        pdfBuffer,
        itineraryPrompt,
        getDeterministicGenerationConfig(),
        getItinerarySchema()
      ).then((result) => {
        onProgress("itinerary", "Accommodation & Transportation extracted", 42);
        return result;
      }),
      executeExtraction(
        pdfBuffer,
        dailyItineraryPrompt,
        getDeterministicGenerationConfig(),
        getDailyItinerarySchema()
      ).then((result) => {
        onProgress("dailyItinerary", "Daily itinerary extracted", 54);
        return result;
      }),
      executeExtraction(
        pdfBuffer,
        pricingPrompt,
        getDeterministicGenerationConfig(),
        getPricingSchema()
      ).then((result) => {
        onProgress("pricing", "Pricing data extracted", 65);
        return result;
      }),
    ]);

    const [marketingData] = marketingResult;
    const [itineraryData] = itineraryResult;
    const [dailyItineraryData] = dailyItineraryResult;
    const [pricingData] = pricingResult;

    // Merge the results from all tasks
    const packageData: PackageData = {
      ...marketingData,
      ...itineraryData,
      ...dailyItineraryData,
      ...pricingData,
      defaultCurrency: "INR",
    };

    packageData.destination = destination;
    packageData.isProcessed = true;
    packageData.isLive = false;

    // Generate embedding
    onProgress("embedding", "Generating search embedding...", 70);
    try {
      const textToEmbed =
        packageData.summary && String(packageData.summary).trim();
      if (textToEmbed) {
        const embedding = await generateEmbedding(textToEmbed);
        (packageData as any).summaryEmbedding = embedding;
        console.log("Embedding generated. Vector length:", embedding.length);
      }
      onProgress("embedding", "Embedding generated successfully", 75);
    } catch (embedError) {
      console.error("Failed to generate embedding:", embedError);
      onProgress("embedding", "Embedding generation skipped", 75);
    }

    // Generate audio from audioSummary
    onProgress("audio", "Generating audio summary...", 80);
    try {
      if (packageData.audioSummary) {
        const audioResult = await generateAudioSummary(
          packageData.audioSummary
        );
        packageData.audioUrl = audioResult.audioUrl;
        console.log(`Audio generated. URL: ${audioResult.audioUrl}`);
        onProgress("audio", "Audio summary generated", 85);
      }
    } catch (audioError) {
      console.error("Failed to generate audio summary:", audioError);
      onProgress("audio", "Audio generation skipped", 85);
    }

    // Generate image URLs
    onProgress("images", "Generating image URLs...", 88);
    try {
      const baseImgUrl =
        "https://travel-images1234.s3.ap-south-1.amazonaws.com";
      const dest = destination;
      const images: string[] = [];
      const used = new Set<number>();
      while (images.length < 3) {
        const n = Math.floor(Math.random() * 25) + 1;
        if (used.has(n)) continue;
        used.add(n);
        images.push(`${baseImgUrl}/${dest}/${dest}_${n}.webp`);
      }
      packageData.imageUrl = images;
      onProgress("images", "Image URLs generated", 90);
    } catch (imgErr) {
      console.warn("Failed to generate imageUrl array:", imgErr);
    }

    // Save to database
    onProgress("database", "Saving package to database...", 92);
    // savePackageData(
    //   packageData,
    //   "output_" + path.basename(localPath, path.extname(localPath)) + ".json"
    // );
    await savePackageToDb(packageId, packageData);
    onProgress("database", "Package saved to database", 98);

    const elapsed = (performance.now() - startTime) / 1000;
    console.log(`Total time: ${elapsed.toFixed(2)} seconds`);
    onProgress(
      "complete",
      `Processing complete in ${elapsed.toFixed(1)}s`,
      100
    );

    return packageData;
  } finally {
    try {
      if (downloadedTemp && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`Deleted temp file: ${localPath}`);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to delete temp file ${localPath}:`, cleanupErr);
    }
  }
}
