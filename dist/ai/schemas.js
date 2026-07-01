export function getMarketingSchema() {
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
                maxLength: 90,
                description: "SEO-friendly travel title, max 14 words. Include destination and the strongest package angle.",
            },
            keywords: {
                type: "array",
                minItems: 5,
                maxItems: 8,
                items: { type: "string", maxLength: 40 },
                description: "5-8 searchable destination, attraction, or experience terms.",
            },
            highlights: {
                type: "array",
                minItems: 3,
                maxItems: 5,
                items: { type: "string", maxLength: 90 },
                description: "3-5 short selling points, each under 14 words. Be specific and benefit-first.",
            },
            description: {
                type: "string",
                maxLength: 650,
                description: "60-90 words. Lead with the traveler benefit, then include specific proof from the itinerary.",
            },
            audioSummary: {
                type: "string",
                maxLength: 650,
                description: "4-6 short lines, max 90 words total, alternating between Speaker 1 and Speaker 2.",
            },
            summary: {
                type: "string",
                maxLength: 220,
                description: "Single sentence (<30 words) including: tour type (e.g. Family Adventure / Luxury Honeymoon / Cultural Explorer), duration (X days / Y nights), hotel category (e.g. 3-Star / Mixed 4–5-Star), destination, 1–2 top highlights. Optimized for semantic vector search.",
            },
            locations: {
                type: "array",
                maxItems: 8,
                items: { type: "string", maxLength: 60 },
                description: "Key places from the PDF, max 8. Use concise place names.",
            },
            activities: {
                type: "array",
                maxItems: 10,
                items: { type: "string", maxLength: 60 },
                description: "Top 8-10 concise activity names from the PDF.",
            },
        },
    };
}
export function getItinerarySchema() {
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
                            maxLength: 80,
                            description: "Name of the hotel or accommodation package.",
                        },
                        stars: {
                            type: "integer",
                            description: "Star rating (e.g., 3, 4, 5).",
                        },
                        roomType: {
                            type: "string",
                            maxLength: 80,
                            description: "Type of room (e.g., Deluxe, Suite, Twin Share).",
                        },
                        details: {
                            type: "string",
                            maxLength: 180,
                            description: "One concise factual sentence about the accommodation.",
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
                        title: { type: "string", maxLength: 90 },
                        vehicle: {
                            type: "string",
                            maxLength: 60,
                            description: "Use the PDF vehicle value when present. Otherwise infer a simple vehicle type.",
                        },
                        details: {
                            type: "string",
                            maxLength: 180,
                            description: "One concise factual sentence. Do not add comfort claims unless present.",
                        },
                        shared: {
                            type: "boolean",
                            description: "Indicates whether the transportation is shared or private. If shared, set to true; if private, set to false.",
                        },
                    },
                },
            },
        },
    };
}
export function getDailyItinerarySchema() {
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
                            maxLength: 420,
                            description: "35-60 words. Summarize the main day plan only.",
                        },
                        meals: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of meals included for the day, e.g., ['Breakfast', 'Dinner'].",
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
                                        description: "Activity name in Title Case (trimmed). Examples: 'Water Park', 'Temple Visit'.",
                                        pattern: "^[A-Z][A-Za-z0-9'\\-\\s:,&()]+$",
                                    },
                                    description: {
                                        type: "string",
                                        minLength: 30,
                                        maxLength: 240,
                                        description: "1-2 short sentences describing what guests see or do. No markdown, lists, or extra quoting.",
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
export function getPricingSchema() {
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
                description: "The start date of the package in DD-MM-YYYY format. If not available, use a placeholder or omit.",
            },
            endDate: {
                type: "string",
                pattern: "^\\d{2}-\\d{2}-\\d{4}$",
                description: "The end date of the package in DD-MM-YYYY format. If not available, use a placeholder or omit.",
            },
            bookingDeadline: {
                type: "string",
                pattern: "^\\d{2}/\\d{2}/\\d{4}$",
                description: "The deadline for booking the package, in MM/DD/YYYY format.",
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
                description: "List of price entries. Each entry contains price, passenger type (Adult/Child), currency (ISO 4217) and optional details.",
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
                            description: "Passenger type for this price entry. If type is not specified, assume Adult.",
                        },
                        currency: {
                            type: "string",
                            description: "ISO 4217 three-letter currency code (e.g., USD, INR, EUR).",
                        },
                        details: {
                            type: "string",
                            description: "detials about the price entry (e.g., '1 bed extra', 'child under 5').",
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
                description: "Important notes regarding the package. Don't mention visa related infomation.",
            },
        },
    };
}
