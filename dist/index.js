import http from "http";
import https from "https";
import express from "express";
import app from "./app.js";
import { config } from "./config/index.js";
import { getSSLOptions } from "./utils/ssl.js";
import dbConnect from "./db/connection.js";
async function startServer() {
    try {
        // Connect to Database
        await dbConnect();
        const sslOptions = getSSLOptions();
        if (sslOptions) {
            // Start HTTPS server
            https.createServer(sslOptions, app).listen(config.httpsPort, () => {
                console.log(`✅ HTTPS Server running on port ${config.httpsPort}`);
                console.log(`🔒 Secure MakemyPackages Email Scanner Server accessible at api.makemypackages.com`);
            });
            // In production, also start HTTP server for redirects
            if (config.nodeEnv === "production") {
                const httpRedirectApp = express();
                httpRedirectApp.use((req, res) => {
                    const host = (req.headers.host || "").split(":")[0];
                    const targetPort = config.httpsPort && config.httpsPort !== 443
                        ? `:${config.httpsPort}`
                        : "";
                    res.redirect(301, `https://${host}${targetPort}${req.url}`);
                });
                httpRedirectApp.listen(config.port, () => {
                    console.log(`✅ HTTP Redirect Server running on port ${config.port}`);
                    console.log(`🔄 Redirecting HTTP traffic to HTTPS`);
                });
            }
            else {
                // Development: also start HTTP server
                startHttpServer();
            }
        }
        else {
            console.log("🔧 SSL disabled or failed to initialize, starting HTTP server only");
            startHttpServer();
        }
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
function startHttpServer() {
    const httpServer = http.createServer(app);
    httpServer.listen(config.port, "0.0.0.0", () => {
        console.log(`✅ HTTP Server running on port ${config.port}`);
        console.log(`🌐 MakemyPackages Package Server accessible at http://localhost:${config.port}`);
    });
}
// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
// Global error handlers
process.on("uncaughtException", (error) => {
    console.error("❌ CRITICAL: Uncaught Exception:", error);
    // In a real production app, you might want to exit after logging
    // but let's keep it running as per user preference for now
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});
startServer();
