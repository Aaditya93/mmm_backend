import puppeteer from "puppeteer";
export const generatePdfController = async (req, res) => {
    try {
        const { htmlContent } = req.body;
        if (!htmlContent) {
            res.status(400).json({ error: "htmlContent is required" });
            return;
        }
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--font-render-hinting=none",
            ],
        });
        const page = await browser.newPage();
        // 1. Set Viewport to Desktop size to prevent mobile layout shift
        await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
        // 2. Set Content & Wait for Tailwind CDN to finish
        await page.setContent(htmlContent, {
            waitUntil: ["networkidle0", "domcontentloaded"],
            timeout: 60000,
        });
        // 3. Force "Screen" media type so print styles don't hide backgrounds
        await page.emulateMediaType("screen");
        // 4. Calculate Height (including a safety buffer)
        const bodyHeight = await page.evaluate(() => {
            return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        });
        const pdfBuffer = await page.pdf({
            printBackground: true,
            width: "297mm",
            height: `${bodyHeight + 50}px`,
            pageRanges: "1",
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        await browser.close();
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="package.pdf"',
            "Content-Length": pdfBuffer.length.toString(),
        });
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error("PDF GENERATION ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to generate PDF" });
    }
};
