export function getMarketingSchema(): any {
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

export function getItinerarySchema(): any {
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

export function getDailyItinerarySchema(): any {
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

export function getPricingSchema(): any {
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
