export function createMarketingPrompt() {
    return `
    Extract compact marketing information for a travel package from the provided PDF.
    Write benefit-first, specific copy. Short sentences. No filler.

    JSON RULES:
    - Return only valid JSON. No markdown. No comments.
    - Use double quotes for strings and property names.
    - Escape special characters in strings with \\n and \\".
    - No trailing commas.

    OUTPUT CONTRACT:
    1. title: SEO-friendly travel title, max 14 words.
    2. keywords: 5-8 searchable destination or experience terms.
    3. highlights: 3-5 short selling points, each under 14 words.
    4. description: 60-90 words. Lead with the strongest traveler benefit, then the proof.
    5. audioSummary: 4-6 short lines alternating Speaker 1 and Speaker 2, max 90 words total.
    6. summary: one sentence under 30 words with tour type, duration, hotel category, destination, and 1-2 signature highlights.
    7. locations: key places from the PDF, max 8.
    8. activities: top 8-10 concise activity names from the PDF.

    Keep factual extraction complete. Compress only the wording.
    Strictly follow the JSON schema.

    EXAMPLE OUTPUT:
    {
      "title": "6-Day Bali Family Escape with Nusa Penida",
      "keywords": ["Bali", "Family Tour", "Nusa Penida", "Waterfalls", "Temples", "Watersports"],
      "highlights": [
        "See Lempuyang Temple's Gates of Heaven",
        "Visit Kelingking Beach and Angel Billabong",
        "Enjoy Tanjung Benoa watersports",
        "Explore Tegenungan Waterfall and Kintamani"
      ],
      "description": "Bali feels easy with this 6-day family escape. Stay in 3-star comfort, visit temples, waterfalls, volcano viewpoints, and the beaches of Nusa Penida without planning every transfer yourself. The route balances culture, soft adventure, and photo-ready moments, from Lempuyang Temple to Tanjung Benoa watersports.",
      "audioSummary": "Speaker 1: Six days in Bali, planned for families.\\nSpeaker 2: Temples, waterfalls, watersports, and Nusa Penida are included.\\nSpeaker 1: Stay in comfortable 3-star hotels with key transfers covered.\\nSpeaker 2: A simple, scenic escape with Bali's biggest highlights.",
      "summary": "6-day Bali family tour with 3-star hotels, temples, waterfalls, watersports, and Nusa Penida highlights.",
      "locations": ["Ubud", "Tanjung Benoa", "Uluwatu", "Nusa Penida", "Lempuyang"],
      "activities": ["Temple Visit", "Beach Hopping", "Watersports", "Waterfall Visit", "Volcano View", "Island Tour"]
    }
    Return only valid JSON.
  `;
}
export function createItineraryPrompt() {
    return `
    Extract accommodation and transportation information from the provided PDF.
    Keep details accurate and concise.

    JSON RULES:
    - Return only valid JSON. No markdown. No comments.
    - Use double quotes for strings and property names.
    - Escape special characters in strings with \\n and \\".
    - No trailing commas.

    OUTPUT CONTRACT:
    1. accommodation: extract name, stars, roomType, details. Do not repeat the same hotel for multiple nights.
    2. transportation: extract every non-flight transfer or transport entry found in the PDF.
    3. shared: decode NOTE values exactly: PRV/PVT/private -> false, SIC -> true, missing or "-" -> false.
    4. vehicle: use the PDF value when present. Otherwise infer a simple vehicle type.
    5. details: one concise factual sentence. Do not add luxury or comfort claims unless present.
    6. Never add flights to transportation.

    Strictly follow the JSON schema.

    EXAMPLE OUTPUT:
    {
      "accommodation": [
        {
          "name": "Solaris Kuta",
          "stars": 3,
          "roomType": "Deluxe Room",
          "details": "3-star Deluxe Room on twin sharing basis."
        }
      ],
      "transportation": [
        {
          "type": "transfer",
          "title": "Airport to Hotel Transfer",
          "vehicle": "Private Car",
          "shared": false,
          "details": "Meet at Bali airport and transfer to the hotel."
        },
        {
          "type": "transfer",
          "title": "Phu Quoc Arrival to Grand World",
          "vehicle": "4 Seater Car",
          "shared": true,
          "details": "Shared transfer from Phu Quoc airport to Grand World."
        }
      ]
    }
    Return only valid JSON.
  `;
}
export function createDailyItineraryPrompt() {
    return `
    Extract the daily itinerary from the provided PDF.
    Preserve day order and key attractions. Keep prose compact.

    JSON RULES:
    - Return only valid JSON. No markdown. No comments.
    - Use double quotes for strings and property names.
    - Escape special characters in strings with \\n and \\".
    - No trailing commas.

    OUTPUT CONTRACT:
    1. For each day, return day, title, description, meals, and activityDetails.
    2. description: 35-60 words. Summarize the main day plan only.
    3. activityDetails: include meaningful tours, attractions, parks, temples, safaris, watersports, cultural visits, or island tours.
    4. Skip operational/non-main items as activities: leisure time, meals, hotel check-in, transfers, and flights.
    5. activityDetails.name: Title Case, trimmed, in original order.
    6. activityDetails.description: 1-2 short sentences focused on what guests see or do.

    Strictly follow the JSON schema.

    EXAMPLE OUTPUT:
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival in Bali",
          "description": "Arrive in Bali and transfer to the hotel. Settle in, rest after the journey, and keep the evening free for a slow first look at the nearby area.",
          "meals": [],
          "activityDetails": []
        },
        {
          "day": 2,
          "title": "Tegenungan Waterfall and Kintamani",
          "description": "Visit Tegenungan Waterfall, continue to Kintamani for volcano views, then explore Ubud highlights including the palace, art villages, and the Bali Swing.",
          "meals": ["Breakfast"],
          "activityDetails": [
            {
              "name": "Tegenungan Waterfall Visit",
              "description": "See the waterfall from easy viewing areas and take photos around the lush valley."
            },
            {
              "name": "Kintamani Volcano View",
              "description": "Enjoy panoramic views of Mount Batur and the surrounding highlands."
            }
          ]
        }
      ]
    }
    Return only valid JSON.
  `;
}
export function createPricingPrompt() {
    return `
    Extract pricing, dates, duration, traveler counts, flights, visa, inclusions, exclusions, and notes from the provided PDF.
    This is factual extraction. Keep all found facts, but write concise details.

    JSON RULES:
    - Return only valid JSON. No markdown. No comments.
    - Use double quotes for strings and property names.
    - Escape special characters in strings with \\n and \\".
    - No trailing commas.

    OUTPUT CONTRACT:
    1. priceData: extract available Adult and Child prices. Every price entry must include type.
    2. Default ambiguous prices to "Adult". Use "Child" only when the PDF clearly says child, children, kid, infant, toddler, below/under age, or child with bed.
    3. Use ISO 4217 currency codes only.
    4. Dates: startDate/endDate as DD-MM-YYYY and bookingDeadline as MM/DD/YYYY when present.
    5. Duration: extract days and nights.
    6. Travelers: extract adult and child counts.
    7. Flights: include only explicitly mentioned flights. Preserve airline, number, times, baggage, layovers, price, and currency when present.
    8. Visa: extract visa costs and concise details. If type is missing, use Adult.
    9. Inclusions, exclusions, and notes: list all clear items. Do not put visa information in notes.

    Strictly follow the JSON schema.

    EXAMPLE OUTPUT:
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
      "bookingDeadline": "10/20/2024",
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
            }
          ],
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
          "details": "Visa on Arrival for 30 days.",
          "type": "Adult"
        }
      ],
      "inclusions": ["Transportation by 4-seater car", "Mineral water during tours"],
      "exclusions": ["Airline ticket", "Driver and guide tips", "Personal expenses"],
      "notes": ["Prices are subject to availability and seasonality."]
    }
    Return only valid JSON.
  `;
}
