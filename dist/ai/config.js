import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
export function initializeGeminiClient() {
    const apiKey = config.google.apiKey;
    if (!apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is required");
    }
    return new GoogleGenerativeAI(apiKey);
}
export function getCreativeGenerationConfig() {
    return {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 40000,
    };
}
export function getDeterministicGenerationConfig() {
    return {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 40000,
    };
}
