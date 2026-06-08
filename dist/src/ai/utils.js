import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";
import dbConnect from "../db/connection.js";
import Package from "../db/Package.js";
export function generateImageUrls(destination) {
    const baseImgUrl = "https://travel-images1234.s3.ap-south-1.amazonaws.com";
    const images = [];
    const folders = destination
        .split("+")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    if (folders.length === 0)
        folders.push(destination);
    const used = new Set();
    while (images.length < 3) {
        const folder = folders[Math.floor(Math.random() * folders.length)];
        const n = Math.floor(Math.random() * 25) + 1;
        const imgPath = `${folder}/${folder}_${n}.webp`;
        if (used.has(imgPath))
            continue;
        used.add(imgPath);
        images.push(`${baseImgUrl}/${imgPath}`);
    }
    return images;
}
export async function downloadToTempFile(url) {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        const isDocx = url.endsWith(".docx") || url.endsWith(".doc");
        const extension = isDocx ? ".docx" : ".pdf";
        const mimeType = isDocx
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";
        const tempFilePath = path.join(os.tmpdir(), `pkg_${Date.now()}${extension}`);
        const writer = fs.createWriteStream(tempFilePath);
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on("error", (err) => {
                error = err;
                writer.close();
                reject(err);
            });
            response.data.on("error", (err) => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on("finish", () => {
                if (!error) {
                    resolve({ filePath: tempFilePath, mimeType });
                }
            });
        });
    }
    catch (error) {
        throw new Error(`Failed to download file: ${error}`);
    }
}
export async function savePackageToDb(packageId, packageData) {
    try {
        const convertedData = { ...packageData };
        if (convertedData.startDate &&
            typeof convertedData.startDate === "string") {
            const [day, month, year] = convertedData.startDate.split("-").map(Number);
            convertedData.startDate = new Date(year, month - 1, day);
        }
        if (convertedData.endDate && typeof convertedData.endDate === "string") {
            const [day, month, year] = convertedData.endDate.split("-").map(Number);
            convertedData.endDate = new Date(year, month - 1, day);
        }
        if (convertedData.bookingDeadline &&
            typeof convertedData.bookingDeadline === "string") {
            const [month, day, year] = convertedData.bookingDeadline
                .split("/")
                .map(Number);
            convertedData.bookingDeadline = new Date(year, month - 1, day);
        }
        if (convertedData.flights) {
            convertedData.flights = convertedData.flights.map((flight) => {
                if (flight.departure?.date) {
                    const [day, month, year] = flight.departure.date
                        .split("-")
                        .map(Number);
                    flight.departure.dateTime = new Date(year, month - 1, day);
                }
                if (flight.arrival?.date) {
                    const [day, month, year] = flight.arrival.date.split("-").map(Number);
                    flight.arrival.dateTime = new Date(year, month - 1, day);
                }
                return flight;
            });
        }
        await dbConnect();
        const res = await Package.findByIdAndUpdate(packageId, convertedData, {
            upsert: true,
        });
    }
    catch (error) {
        console.error("Error saving package to DB:", error);
        throw new Error(`Failed to save package to DB: ${error}`);
    }
}
