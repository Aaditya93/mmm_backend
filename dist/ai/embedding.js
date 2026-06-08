import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
const genAI = new GoogleGenAI({
    apiKey: config.google.paidApiKey || config.google.apiKey || "",
});
/**

 * @param text The input text to embed.
 * @returns A promise that resolves to an array of numbers representing the vector embedding.
 */
export async function generateEmbedding(text) {
    if (!text || text.trim() === "") {
        return [];
    }
    try {
        const result = await genAI.models.embedContent({
            model: "gemini-embedding-2",
            contents: [text],
        });
        const embedding = result.embeddings?.[0];
        if (embedding?.values?.length) {
            return embedding.values;
        }
        throw new Error("No embedding data returned from Google GenAI API.");
    }
    catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error(`Failed to generate embedding from Google GenAI: ${error}`);
    }
}
