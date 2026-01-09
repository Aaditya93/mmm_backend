import * as fs from "fs";
import * as path from "path";
import { getCreativeGenerationConfig, getDeterministicGenerationConfig, } from "./config.js";
import { getMarketingSchema, getItinerarySchema, getDailyItinerarySchema, getPricingSchema, } from "./schemas.js";
import { createMarketingPrompt, createItineraryPrompt, createDailyItineraryPrompt, createPricingPrompt, } from "./prompts.js";
import { executeExtraction } from "./extractor.js";
import { downloadToTempFile, generateImageUrls, savePackageToDb, } from "./utils.js";
import { generateAudioSummary } from "../audio/index.js";
import { generateEmbedding } from "./embedding.js";
export async function processPackagePdfWithProgress(packageId, pdfPath, destination, onProgress) {
    let localPath = pdfPath;
    let downloadedTemp = false;
    onProgress("download", "Downloading PDF file...", 5);
    const { filePath } = await downloadToTempFile(pdfPath);
    localPath = filePath;
    downloadedTemp = true;
    if (!fs.existsSync(localPath)) {
        throw new Error(`PDF file not found: ${localPath}`);
    }
    const startTime = performance.now();
    onProgress("download", "PDF downloaded successfully", 10);
    try {
        onProgress("extraction", "Extracting package data from PDF...", 15);
        const pdfBuffer = fs.readFileSync(localPath);
        const ext = path.extname(pdfPath).toLowerCase();
        const mimeType = ext === ".docx" || ext === ".doc"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";
        const marketingPrompt = createMarketingPrompt();
        const itineraryPrompt = createItineraryPrompt();
        const dailyItineraryPrompt = createDailyItineraryPrompt();
        const pricingPrompt = createPricingPrompt();
        onProgress("extraction", "Running AI extraction (Marketing, Itinerary, Daily Itinerary, Pricing)...", 20);
        const [marketingResult, itineraryResult, dailyItineraryResult, pricingResult,] = await Promise.all([
            executeExtraction(pdfBuffer, marketingPrompt, getCreativeGenerationConfig(), getMarketingSchema(), mimeType).then((result) => {
                onProgress("marketing", "Marketing data extracted", 30);
                return result;
            }),
            executeExtraction(pdfBuffer, itineraryPrompt, getDeterministicGenerationConfig(), getItinerarySchema(), mimeType).then((result) => {
                onProgress("itinerary", "Accommodation & Transportation extracted", 42);
                return result;
            }),
            executeExtraction(pdfBuffer, dailyItineraryPrompt, getDeterministicGenerationConfig(), getDailyItinerarySchema(), mimeType).then((result) => {
                onProgress("dailyItinerary", "Daily itinerary extracted", 54);
                return result;
            }),
            executeExtraction(pdfBuffer, pricingPrompt, getDeterministicGenerationConfig(), getPricingSchema(), mimeType).then((result) => {
                onProgress("pricing", "Pricing data extracted", 65);
                return result;
            }),
        ]);
        const [marketingData] = marketingResult;
        const [itineraryData] = itineraryResult;
        const [dailyItineraryData] = dailyItineraryResult;
        const [pricingData] = pricingResult;
        const packageData = {
            ...marketingData,
            ...itineraryData,
            ...dailyItineraryData,
            ...pricingData,
            defaultCurrency: "INR",
        };
        packageData.destination = destination;
        packageData.isProcessed = true;
        packageData.isLive = false;
        onProgress("embedding", "Generating search embedding...", 70);
        try {
            const textToEmbed = packageData.summary && String(packageData.summary).trim();
            if (textToEmbed) {
                const embedding = await generateEmbedding(textToEmbed);
                packageData.summaryEmbedding = embedding;
            }
            onProgress("embedding", "Embedding generated successfully", 75);
        }
        catch (embedError) {
            console.error("Failed to generate embedding:", embedError);
            onProgress("embedding", "Embedding generation skipped", 75);
        }
        onProgress("audio", "Generating audio summary...", 80);
        try {
            if (packageData.audioSummary) {
                const audioResult = await generateAudioSummary(packageData.audioSummary);
                packageData.audioUrl = audioResult.audioUrl;
                onProgress("audio", "Audio summary generated", 85);
            }
        }
        catch (audioError) {
            console.error("Failed to generate audio summary:", audioError);
            onProgress("audio", "Audio generation skipped", 85);
        }
        onProgress("images", "Generating image URLs...", 88);
        try {
            packageData.imageUrl = generateImageUrls(destination);
            onProgress("images", "Image URLs generated", 90);
        }
        catch (imgErr) {
            console.warn("Failed to generate imageUrl array:", imgErr);
        }
        onProgress("database", "Saving package to database...", 92);
        await savePackageToDb(packageId, packageData);
        onProgress("database", "Package saved to database", 98);
        const elapsed = (performance.now() - startTime) / 1000;
        onProgress("complete", `Processing complete in ${elapsed.toFixed(1)}s`, 100);
        return packageData;
    }
    finally {
        try {
            if (downloadedTemp && fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
        catch (cleanupErr) {
            console.warn(`Failed to delete temp file ${localPath}:`, cleanupErr);
        }
    }
}
