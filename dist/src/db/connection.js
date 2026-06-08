import mongoose from "mongoose";
import { config } from "../config/index.js";
async function dbConnect() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        if (!config.mongodbUri) {
            throw new Error("MONGODB_URI is not defined");
        }
        await mongoose.connect(config.mongodbUri);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}
export default dbConnect;
