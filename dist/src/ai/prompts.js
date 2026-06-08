export function createMarketingPrompt() {
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
      ]
    }
    \`\`\`
    Return only valid JSON without additional text or formatting.
  `;
}
export function createItineraryPrompt() {
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
    2.  **TRANSPORTATION:** Never add Flights in Transfer. Extract transportation entries found in the PDF. The PDF may contain a table with columns like DAY / BRIEF ITINERARY / HOTEL / MEAL / NOTE / GUIDE. When a "NOTE" column contains PRV, PVT or PVT (private) mark shared: false. When it contains SIC mark shared: true. If NOTE is '-' or missing, default to shared: false. Map common wording in itinerary or brief itinerary column to vehicle types using these rules (case-insensitive):
      For each transportation item include: { type, title, vehicle, details, shared }.
      Get All the transportation entries from the pdf. Note it is  neessary to get all the transportation entries from the pdf.
      When the PDF uses abbreviations PRV/PVT/SIC, decode them exactly: PRV/PVT -> shared: false, SIC -> shared: true.
      Focus more On SIC vs PVT/PRV for shared field rather than vehicle type. 
      Don't add Flights in Transportation.
   

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
export function createDailyItineraryPrompt() {
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
export function createPricingPrompt() {
    return `
    Extract the pricing, dates, and flight information from the provided PDF.
    
     **JSON FORMATTING RULES (CRITICAL):**
    - Return ONLY valid JSON, no markdown code blocks
    - Use double quotes for all strings and property names
    - Escape special characters in strings: use \\n for newlines, \\" for quotes
    - NO trailing commas after the last item in arrays or objects
    - NO comments in the JSON

    **CRITICAL INSTRUCTIONS:**
     1.  **PRICING:** Extract the available price information for Adult and Child. EVERY price entry must include a \\\"type\\\" field.
        - If the source text does NOT explicitly indicate a child fare (words like: child, children, kid, kids, infant, toddler, "below X years", "under X years", "child with bed"), you MUST set \\\"type\\\": \\\"Adult\\\" (default to Adult when ambiguous).
        - Only set \\\"type\\\": \\\"Child\\\" when the PDF text clearly indicates a child-specific price.
        - Preserve any qualifier in \\\"details\\\" (e.g., age ranges, bed info).
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
