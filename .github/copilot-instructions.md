# MakemyPackages Backend - AI Coding Instructions

## Project Overview

This is a Node.js/TypeScript backend for processing travel packages. It uses Google Gemini AI to extract structured data from PDFs/Docs, generates audio summaries, and stores everything in MongoDB.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Generative AI (Gemini)
- **Storage**: AWS S3 (for audio files)
- **PDF Generation**: Puppeteer
- **Audio Processing**: fluent-ffmpeg

## Key Conventions & Patterns

### 1. ESM Imports

Always use the `.js` extension in relative imports, as this project uses ES Modules.

- **Correct**: `import dbConnect from "./db/connection.js";`
- **Incorrect**: `import dbConnect from "./db/connection";`

### 2. AI Structured Output

When working with Gemini, use JSON schemas for structured data extraction. See `src/ai.ts` for examples like `getMarketingSchema()` and `getDailyItinerarySchema()`.

- Use `responseMimeType: "application/json"` in generation configs.
- Define clear descriptions in schemas to guide the AI's output quality.

### 3. Long-running Tasks & SSE

The `/create-package` endpoint uses Server-Sent Events (SSE) to provide real-time progress updates to the client.

- Use `res.write(`data: ${JSON.stringify(...)}\n\n`)` for updates.
- Implement heartbeats to keep the connection alive.
- Example: [src/index.ts](src/index.ts#L210)

### 4. Database Models

Models are located in `src/db/`. Use TypeScript interfaces that extend `mongoose.Document` (or are used within `mongoose.Schema`).

- Main model: [src/db/Package.ts](src/db/Package.ts)

### 5. PDF Processing

PDF generation from HTML is handled via Puppeteer in `src/pdf.ts`. It uses a "screen" media type emulation to preserve backgrounds and Tailwind styles.

## Developer Workflows

- **Build**: `npm run build` (uses `tsc -b`)
- **Environment**: Requires `.env` with `MONGODB_URI`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AWS_ACCESS_KEY_ID`, etc.
- **SSL**: In development, the server generates self-signed certificates if not present. See `src/index.ts`.

## Directory Structure

- `src/ai.ts`: Core AI processing logic and prompt engineering.
- `src/audio.ts`: Text-to-speech and audio conversion logic.
- `src/embedding.ts`: Vector embedding generation for semantic search.
- `src/db/`: Mongoose schemas and connection logic.
- `tmp/uploads/`: Local temporary storage for file processing.
