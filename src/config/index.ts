import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  httpsPort: Number(process.env.HTTPS_PORT) || 443,
  nodeEnv: process.env.NODE_ENV || "development",
  useSSL:
    process.env.USE_SSL === "true" || process.env.NODE_ENV === "production",
  mongodbUri: process.env.MONGODB_URI,
  ssl: {
    dir: process.env.SSL_DIR || "/etc/letsencrypt/live/api.makemypackages.com",
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
    bucketName: process.env.AWS_S3_BUCKET_NAME,
  },
  google: {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    paidApiKey:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY_PAID ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
};

if (!config.mongodbUri) {
  console.warn("⚠️ MONGODB_URI is not defined in environment variables");
}
