import { processPackagePdfWithProgress } from "../ai/processor.js";
export const createPackage = async (req, res) => {
    try {
        const { packageId, packageUrl, destination } = req.body;
        if (!packageId || !packageUrl || !destination) {
            return res.status(400).json({
                success: false,
                message: "packageId, packageUrl and destination are required",
            });
        }
        // SSE headers + disable buffering for proxies (nginx)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // nginx
        // prevent node from timing out the socket
        if (req.socket)
            req.socket.setTimeout(0);
        res.flushHeaders();
        // heartbeat to keep connection alive (every 20s)
        const heartbeat = setInterval(() => {
            try {
                res.write(`: heartbeat\n\n`);
            }
            catch (e) {
                /* ignore write errors */
            }
        }, 20000);
        // detect client disconnect
        const onClose = () => {
            clearInterval(heartbeat);
        };
        req.on("close", onClose);
        // Helper to send progress updates
        const sendProgress = (step, message, progress) => {
            try {
                res.write(`data: ${JSON.stringify({
                    type: "progress",
                    step,
                    message,
                    progress,
                })}\n\n`);
            }
            catch (e) {
                console.warn("Failed to write SSE progress:", e);
            }
        };
        const packageData = await processPackagePdfWithProgress(packageId, packageUrl, destination, sendProgress);
        // Send final response
        res.write(`data: ${JSON.stringify({
            type: "complete",
            success: true,
            package: packageData,
        })}\n\n`);
        clearInterval(heartbeat);
        req.off("close", onClose);
        res.end();
    }
    catch (error) {
        console.error("Failed to create package:", error);
        try {
            res.write(`data: ${JSON.stringify({
                type: "error",
                success: false,
                message: "Failed to create package",
            })}\n\n`);
        }
        catch (e) {
            /* ignore */
        }
        res.end();
    }
};
