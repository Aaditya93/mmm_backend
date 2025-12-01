import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY_PAID || ""
);

/**
 * Generates a vector embedding for a given text using Google's embedding-001 model.
 * @param text The input text to embed.
 * @returns A promise that resolves to an array of numbers representing the vector embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === "") {
    console.warn("Embedding generation skipped: input text is empty.");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    if (embedding && embedding.values) {
      return embedding.values;
    } else {
      throw new Error("No embedding data returned from Google GenAI API.");
    }
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding from Google GenAI: ${error}`);
  }
}
