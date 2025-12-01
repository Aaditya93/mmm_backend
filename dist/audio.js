import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { writeFile } from "fs";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";
import { uploadAudioToS3 } from "./s3.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
dotenv.config();
const ffmpegBinaryPath = ffmpegStatic;
// Set bundled FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegBinaryPath);
function saveBinaryFile(fileName, content) {
    return new Promise((resolve, reject) => {
        writeFile(fileName, content, (err) => {
            if (err) {
                console.error(`Error writing file ${fileName}:`, err);
                reject(err);
                return;
            }
            console.log(`File ${fileName} saved to file system.`);
            resolve();
        });
    });
}
function convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec("libmp3lame")
            .audioBitrate(128)
            .audioChannels(2)
            .audioFrequency(44100)
            .format("mp3")
            .on("end", () => resolve())
            .on("error", reject)
            .save(outputPath);
    });
}
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
    let uploadFilePath = ""; // final file to upload (temp mp3 or wav)
    let audioUrl = "";
    let actualLocalPath = ""; // we delete files; return empty
    // Create temp directory
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
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = `audio_summary_${timestamp}_${fileIndex++}`;
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                let fileExtension = mime.getExtension(inlineData.mimeType || "") || "";
                let buffer = Buffer.from(inlineData.data || "", "base64");
                console.log(`Received audio data: ${inlineData.mimeType}, detected extension: ${fileExtension}`);
                // Ensure a WAV file first
                if (!fileExtension || fileExtension !== "wav") {
                    console.log(`Converting ${inlineData.mimeType || "unknown"} to WAV format`);
                    fileExtension = "wav";
                    buffer = convertToWav(inlineData.data || "", inlineData.mimeType || "");
                }
                // Save WAV to temp only
                const tempWavPath = path.join(tempDir, `${fileName}.wav`);
                await saveBinaryFile(tempWavPath, buffer);
                console.log(`✅ WAV file saved to temp: ${tempWavPath}`);
                // Convert WAV -> MP3 in temp
                const tempMp3Path = path.join(tempDir, `${fileName}.mp3`);
                try {
                    console.log(`🔄 Converting WAV to MP3...`);
                    await convertToMp3(tempWavPath, tempMp3Path);
                    console.log(`✅ MP3 created in temp: ${tempMp3Path}`);
                    uploadFilePath = tempMp3Path;
                    // Remove temp WAV after successful conversion
                    await fs.rm(tempWavPath, { force: true });
                }
                catch (err) {
                    console.error("❌ Failed to convert WAV to MP3:", err);
                    // Fallback to WAV upload
                    uploadFilePath = tempWavPath;
                }
            }
            else {
                console.log(chunk.text);
            }
        }
        // Upload to S3
        if (uploadFilePath) {
            console.log(`🚀 Uploading to S3: ${uploadFilePath}`);
            audioUrl = await uploadAudioToS3(uploadFilePath, bucketName);
            console.log(`✅ Audio file uploaded to S3: ${audioUrl}`);
        }
    }
    finally {
        // Delete any temp files and directory (no backups)
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log("🗑️  Temp directory cleaned up (all files deleted)");
        }
        catch (error) {
            console.warn("⚠️  Failed to clean up temp directory:", error);
        }
    }
    // Calculate costs
    const inputCost = (totalPromptTokens / 1_000_000) * 0.5;
    const outputCost = (totalOutputTokens / 1_000_000) * 10;
    const totalCost = inputCost + outputCost;
    console.log(`\n=== AUDIO GENERATION SUMMARY ===`);
    console.log(`Token Usage:`);
    console.log(`  Prompt Tokens: ${totalPromptTokens}`);
    console.log(`  Output Tokens: ${totalOutputTokens}`);
    console.log(`  Total Tokens: ${totalTokens}`);
    console.log(`Cost Calculation:`);
    console.log(`  Input Cost: $${inputCost.toFixed(4)}`);
    console.log(`  Output Cost: $${outputCost.toFixed(4)}`);
    console.log(`  Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`Files:`);
    console.log(`  Local Path: (deleted)`);
    console.log(`  S3 URL: ${audioUrl}`);
    console.log(`===================================\n`);
    return {
        audioUrl,
        localPath: actualLocalPath, // empty, since files are deleted
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
function convertToWav(rawData, mimeType) {
    const options = parseMimeType(mimeType);
    const wavHeader = createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, "base64");
    return Buffer.concat([wavHeader, buffer]);
}
function parseMimeType(mimeType) {
    const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
    const [_, format] = fileType.split("/");
    const options = {
        numChannels: 1,
        sampleRate: 22050,
        bitsPerSample: 16,
    };
    if (format && format.startsWith("L")) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }
    for (const param of params) {
        const [key, value] = param.split("=").map((s) => s.trim());
        if (key === "rate") {
            options.sampleRate = parseInt(value, 10);
        }
    }
    return options;
}
function createWavHeader(dataLength, options) {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}
