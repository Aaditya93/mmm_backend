import express from "express";
import multer from "multer";

import fs from "fs";
import path from "path";
import cors from "cors";
import http from "http";
import https from "https";
import { execSync } from "child_process";
import { processPackagePdfWithProgress } from "./ai.js";
import { generatePdfController } from "./pdf.js";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 443;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://api.makemypackages.com",
      "https://main.d3cl9zxj5czhv3.amplifyapp.com",
    ],
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create uploads directory if it doesn't exist
const uploadsDir = "tmp/uploads/";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer to preserve the original file extension
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  });
});

// Production SSL setup
const isProduction = process.env.NODE_ENV === "production";
const useSSL = process.env.USE_SSL === "true" || isProduction;

if (useSSL) {
  try {
    // Production SSL certificate paths (for Let's Encrypt)
    const sslDir =
      process.env.SSL_DIR || "/etc/letsencrypt/live/api.makemypackages.com";
    const keyPath =
      process.env.SSL_KEY_PATH || path.join(sslDir, "privkey.pem");
    const certPath =
      process.env.SSL_CERT_PATH || path.join(sslDir, "fullchain.pem");

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log("🔒 SSL certificates not found.");

      if (isProduction) {
        console.error("❌ Production SSL certificates are required!");
        console.log("🔧 To get Let's Encrypt certificates, run:");
        console.log("   sudo apt update && sudo apt install certbot");
        console.log(
          "   sudo certbot certonly --standalone -d api.makemypackages.com"
        );
        console.log(
          "   sudo chown -R $USER:$USER /etc/letsencrypt/live/api.makemypackages.com/"
        );
        console.log(
          "   Or set SSL_KEY_PATH and SSL_CERT_PATH environment variables"
        );

        // In production, fall back to HTTP instead of exiting
        console.log("⚠️  Starting HTTP server as fallback...");
        startHttpServer();
      } else {
        console.log(
          "🔧 Development mode: Creating self-signed certificates..."
        );

        if (!fs.existsSync(sslDir)) {
          fs.mkdirSync(sslDir, { recursive: true });
        }

        const openSSLCommand = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=/CN=api.makemypackages.com"`;

        try {
          execSync(openSSLCommand, { stdio: "inherit" });
          console.log("✅ Development SSL certificates created!");
        } catch (certError) {
          console.error("❌ Failed to create SSL certificates:", certError);
          console.log("⚠️  Falling back to HTTP server...");
          startHttpServer();
        }
      }
    } else {
      console.log("✅ SSL certificates found");
    }

    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // Start HTTPS server — bind to all addresses (accept IPv4 & IPv6)
    https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
      console.log(`✅ HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(
        `🔒 Secure MakemyPackages Email Scanner Server accessible at:`
      );
      console.log(`   - api.makemypackages.com`);
      if (!isProduction) {
        console.log(`   - https://localhost:${HTTPS_PORT}`);
      }
      console.log(`📊 API Endpoints (HTTPS):`);
      console.log(`   - GET  /health (health check)`);
      console.log(`   - POST /hotels (hotel data processing)`);

      if (!isProduction) {
        console.log(
          "⚠️  Note: Using self-signed certificate in development mode."
        );
      }
    });

    // In production, also start HTTP server for redirects
    if (isProduction) {
      const httpRedirectApp = express();
      httpRedirectApp.use((req, res) => {
        const host = (req.headers.host || "").split(":")[0];
        const targetPort =
          HTTPS_PORT && HTTPS_PORT !== 443 ? `:${HTTPS_PORT}` : "";
        res.redirect(301, `https://${host}${targetPort}${req.url}`);
      });

      httpRedirectApp.listen(PORT, () => {
        console.log(`✅ HTTP Redirect Server running on port ${PORT}`);
        console.log(`🔄 Redirecting HTTP traffic to HTTPS`);
      });
    } else {
      // Development: also start HTTP server
      startHttpServer();
    }
  } catch (error) {
    console.error("❌ Failed to start HTTPS server:", error);
    console.log("⚠️  Falling back to HTTP server...");
    startHttpServer();
  }
} else {
  console.log("🔧 SSL disabled, starting HTTP server only");
  startHttpServer();
}

function startHttpServer() {
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ HTTP Server running on port ${PORT}`);
    console.log(`🌐 MakemyPackages Email Scanner Server accessible at:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://api.makemypackages.com:${PORT}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   - GET  /health (health check)`);
  });
}
app.post("/generate-pdf", generatePdfController);
// Route to create package from PDF with progress updates (SSE)
app.post("/create-package", async (req, res) => {
  try {
    const { packageId, packageUrl, destination } = req.body;
    console.log("Received /create-package request:", {
      packageId,
      packageUrl,
      destination,
    });

    if (!packageUrl || !destination) {
      return res.status(400).json({
        success: false,
        message: "packageUrl and destination are required",
      });
    }

    // SSE headers + disable buffering for proxies (nginx)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // nginx
    // prevent node from timing out the socket
    if (req.socket) req.socket.setTimeout(0);
    res.flushHeaders();

    // heartbeat to keep connection alive (every 20s)
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (e) {
        /* ignore write errors */
      }
    }, 20000);

    // detect client disconnect
    const onClose = () => {
      clearInterval(heartbeat);
      console.log("SSE connection closed by client");
    };
    req.on("close", onClose);

    // Helper to send progress updates
    const sendProgress = (step: string, message: string, progress: number) => {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: "progress",
            step,
            message,
            progress,
          })}\n\n`
        );
      } catch (e) {
        console.warn("Failed to write SSE progress:", e);
      }
    };

    const packageData = await processPackagePdfWithProgress(
      packageId,
      packageUrl,
      destination,
      sendProgress
    );
    console.log("Package created successfully:", packageData);

    // Send final response
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        success: true,
        package: packageData,
      })}\n\n`
    );
    clearInterval(heartbeat);
    req.off("close", onClose);
    res.end();
  } catch (error) {
    console.error("Failed to create package:", error);
    try {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          success: false,
          message: "Failed to create package",
        })}\n\n`
      );
    } catch (e) {
      /* ignore */
    }
    res.end();
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
