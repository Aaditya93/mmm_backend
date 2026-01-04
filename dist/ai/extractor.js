import * as fs from "fs";
import * as path from "path";
import mammoth from "mammoth";
import { initializeGeminiClient, getCreativeGenerationConfig, getDeterministicGenerationConfig, } from "./config.js";
import { getMarketingSchema, getItinerarySchema, getDailyItinerarySchema, getPricingSchema, } from "./schemas.js";
import { createMarketingPrompt, createItineraryPrompt, createDailyItineraryPrompt, createPricingPrompt, } from "./prompts.js";
export async function executeExtraction(fileBuffer, prompt, generationConfig, schema, mimeType = "application/pdf") {
    const genAI = initializeGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const genOptions = {
        temperature: generationConfig.temperature,
        topP: generationConfig.topP,
        topK: generationConfig.topK,
        maxOutputTokens: generationConfig.maxOutputTokens,
        responseMimeType: "application/json",
    };
    if (schema) {
        genOptions.responseSchema = schema;
    }
    let inlinePayload;
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (mimeType === docxMime) {
        try {
            const { value: extractedText } = await mammoth.extractRawText({
                buffer: fileBuffer,
            });
            inlinePayload = {
                data: Buffer.from(String(extractedText), "utf-8").toString("base64"),
                mimeType: "text/plain",
            };
        }
        catch (err) {
            throw new Error(`Failed to extract text from DOCX: ${err?.message || err}`);
        }
    }
    else {
        inlinePayload = {
            data: fileBuffer.toString("base64"),
            mimeType,
        };
    }
    const result = await model.generateContent([
        {
            inlineData: inlinePayload,
        },
        prompt,
    ], genOptions);
    console.log("token usage:", result.response.usageMetadata?.totalTokenCount);
    let responseText = result.response.text();
    responseText = responseText.trim();
    if (responseText.startsWith("```json")) {
        responseText = responseText
            .replace("```json", "")
            .replace("```", "")
            .trim();
    }
    else if (responseText.startsWith("```")) {
        responseText = responseText.replace("```", "").trim();
    }
    const parsed = JSON.parse(responseText);
    return [parsed];
}
export async function extractPackageData(pdfPath, onProgress) {
    try {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const ext = path.extname(pdfPath).toLowerCase();
        const mimeType = ext === ".docx" || ext === ".doc"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";
        const marketingPrompt = createMarketingPrompt();
        const itineraryPrompt = createItineraryPrompt();
        const dailyItineraryPrompt = createDailyItineraryPrompt();
        const pricingPrompt = createPricingPrompt();
        if (onProgress) {
            onProgress("extraction", "Running AI extraction (Marketing, Itinerary, Daily Itinerary, Pricing)...", 20);
        }
        const [marketingResult, itineraryResult, dailyItineraryResult, pricingResult,] = await Promise.all([
            executeExtraction(pdfBuffer, marketingPrompt, getCreativeGenerationConfig(), getMarketingSchema(), mimeType).then((result) => {
                if (onProgress)
                    onProgress("marketing", "Marketing data extracted", 30);
                return result;
            }),
            executeExtraction(pdfBuffer, itineraryPrompt, getDeterministicGenerationConfig(), getItinerarySchema(), mimeType).then((result) => {
                if (onProgress)
                    onProgress("itinerary", "Accommodation & Transportation extracted", 42);
                return result;
            }),
            executeExtraction(pdfBuffer, dailyItineraryPrompt, getDeterministicGenerationConfig(), getDailyItinerarySchema(), mimeType).then((result) => {
                if (onProgress)
                    onProgress("dailyItinerary", "Daily itinerary extracted", 54);
                return result;
            }),
            executeExtraction(pdfBuffer, pricingPrompt, getDeterministicGenerationConfig(), getPricingSchema(), mimeType).then((result) => {
                if (onProgress)
                    onProgress("pricing", "Pricing data extracted", 65);
                return result;
            }),
        ]);
        const [marketingData] = marketingResult;
        const [itineraryData] = itineraryResult;
        const [dailyItineraryData] = dailyItineraryResult;
        const [pricingData] = pricingResult;
        const combinedData = {
            ...marketingData,
            ...itineraryData,
            ...dailyItineraryData,
            ...pricingData,
            defaultCurrency: "INR",
        };
        return { data: combinedData };
    }
    catch (error) {
        console.error("Extraction error:", error);
        throw new Error("Failed to extract package data");
    }
}
