import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { config } from "../config/index.js";

export interface SSLOptions {
  key: Buffer;
  cert: Buffer;
}

export function getSSLOptions(): SSLOptions | null {
  if (!config.useSSL) return null;

  const keyPath =
    config.ssl.keyPath || path.join(config.ssl.dir, "privkey.pem");
  const certPath =
    config.ssl.certPath || path.join(config.ssl.dir, "fullchain.pem");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log("🔒 SSL certificates not found.");

    if (config.nodeEnv === "production") {
      console.error("❌ Production SSL certificates are required!");

      return null;
    } else {
      console.log("🔧 Development mode: Creating self-signed certificates...");

      if (!fs.existsSync(config.ssl.dir)) {
        fs.mkdirSync(config.ssl.dir, { recursive: true });
      }

      const openSSLCommand = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=/CN=api.makemypackages.com"`;

      try {
        execSync(openSSLCommand, { stdio: "inherit" });
        console.log("✅ Development SSL certificates created!");
      } catch (certError) {
        console.error("❌ Failed to create SSL certificates:", certError);
        return null;
      }
    }
  } else {
    console.log("✅ SSL certificates found");
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}
