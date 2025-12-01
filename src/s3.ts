import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { readFile, unlink } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAudioToS3(
  filePath: string,
  bucketName: string,
  customMimeType?: string
): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);

    // Get file extension to determine mime type and S3 key
    const fileExtension = path.extname(filePath).toLowerCase();
    let mimeType = customMimeType;
    let s3KeyExtension = fileExtension;

    // Set appropriate mime type based on file extension
    if (!mimeType) {
      switch (fileExtension) {
        case ".mp3":
          mimeType = "audio/mpeg";
          s3KeyExtension = ".mp3";
          break;
        case ".wav":
          mimeType = "audio/wav";
          s3KeyExtension = ".wav";
          break;
        default:
          mimeType = "audio/mpeg"; // Default to MP3
          s3KeyExtension = ".mp3";
      }
    }

    const fileKey = `audio-summaries/${uuidv4()}${s3KeyExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `https://${bucketName}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${fileKey}`;

    console.log(`File uploaded to S3: ${publicUrl} (${mimeType})`);
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
