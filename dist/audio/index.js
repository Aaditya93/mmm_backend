import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { uploadAudioToS3 } from "../services/s3.service.js";
import { convertToMp3, convertToWav } from "./converter.js";
import { saveBinaryFile } from "./utils.js";
export async function generateAudioSummary(scriptContent) {
    const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "my-audio-bucket";
    const config = {
        temperature: 1,
        responseModalities: ["audio"],
        speechConfig: {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    {
                        speaker: "Speaker 1",
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Zephyr",
                            },
                        },
                    },
                    {
                        speaker: "Speaker 2",
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Puck",
                            },
                        },
                    },
                ],
            },
        },
    };
    const model = "gemini-2.5-flash-preview-tts";
    const contents = [
        {
            role: "user",
            parts: [
                {
                    text: `Voice tone:
Warm, inviting, and enthusiastic — with a friendly, storyteller vibe.
Style:
Conversational and cinematic. The narration should feel like a personal travel invitation, not a formal ad.
Pacing:
Moderate and smooth — allow small pauses after each highlight or destination name to let listeners visualize the scenes.
Emotion:
Joyful, curious, and full of wonder. The tone should capture the excitement of exploring Bali's natural beauty and cultural charm.
${scriptContent}`,
                },
            ],
        },
    ];
    const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
    });
    let fileIndex = 0;
    let totalPromptTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let uploadFilePath = "";
    let audioUrl = "";
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audio-summary-"));
    try {
        for await (const chunk of response) {
            if (chunk.usageMetadata) {
                totalPromptTokens += chunk.usageMetadata.promptTokenCount || 0;
                totalOutputTokens += chunk.usageMetadata.candidatesTokenCount || 0;
                totalTokens += chunk.usageMetadata.totalTokenCount || 0;
            }
            if (!chunk.candidates?.[0]?.content?.parts)
                continue;
            const part = chunk.candidates[0].content.parts[0];
            if (part.inlineData) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = `audio_summary_${timestamp}_${fileIndex++}`;
                const inlineData = part.inlineData;
                let fileExtension = mime.getExtension(inlineData.mimeType || "") || "";
                let buffer;
                if (fileExtension !== "wav") {
                    buffer = convertToWav(inlineData.data || "", inlineData.mimeType || "");
                }
                else {
                    buffer = Buffer.from(inlineData.data || "", "base64");
                }
                const tempWavPath = path.join(tempDir, `${fileName}.wav`);
                await saveBinaryFile(tempWavPath, buffer);
                const tempMp3Path = path.join(tempDir, `${fileName}.mp3`);
                try {
                    await convertToMp3(tempWavPath, tempMp3Path);
                    uploadFilePath = tempMp3Path;
                    await fs.rm(tempWavPath, { force: true });
                }
                catch (err) {
                    console.error("❌ Failed to convert WAV to MP3:", err);
                    uploadFilePath = tempWavPath;
                }
            }
        }
        if (uploadFilePath) {
            audioUrl = await uploadAudioToS3(uploadFilePath, bucketName);
        }
    }
    finally {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn("⚠️  Failed to clean up temp directory:", error);
        }
    }
    const inputCost = (totalPromptTokens / 1_000_000) * 0.5;
    const outputCost = (totalOutputTokens / 1_000_000) * 10;
    const totalCost = inputCost + outputCost;
    return {
        audioUrl,
        localPath: "",
        tokenUsage: {
            promptTokens: totalPromptTokens,
            outputTokens: totalOutputTokens,
            totalTokens,
        },
        cost: {
            inputCost,
            outputCost,
            totalCost,
        },
    };
}
