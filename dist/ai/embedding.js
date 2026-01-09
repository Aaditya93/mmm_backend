import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
const genAI = new GoogleGenerativeAI(config.google.paidApiKey || "");
/**
 * Generates a vector embedding for a given text using Google's embedding-001 model.
 * @param text The input text to embed.
 * @returns A promise that resolves to an array of numbers representing the vector embedding.
 */
export async function generateEmbedding(text) {
    if (!text || text.trim() === "") {
        return [];
    }
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        if (embedding && embedding.values) {
            return embedding.values;
        }
        else {
            throw new Error("No embedding data returned from Google GenAI API.");
        }
    }
    catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error(`Failed to generate embedding from Google GenAI: ${error}`);
    }
}
