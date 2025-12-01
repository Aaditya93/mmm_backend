/**
 * Package Model
 * @description Defines the Mongoose schema and model for a travel package entity.
 * @interface IPackage - TypeScript interface for the Package document structure.
 * @schema packageSchema - Mongoose schema enforcing data validation and structure.
 * @model Package - The compiled Mongoose model for interacting with the Package collection in MongoDB.
 * @returns {mongoose.Model<IPackage>} The Package model instance.
 */
import mongoose from "mongoose";
const itinerarySchema = new mongoose.Schema({
    day: { type: Number },
    title: { type: String },
    description: { type: String },
    meals: { type: [String] },
    activities: { type: [String] },
});
const accommodationSchema = new mongoose.Schema({
    name: { type: String },
    stars: { type: Number },
    roomType: { type: String },
    details: { type: String },
});
const transportationSchema = new mongoose.Schema({
    type: { type: String },
    title: { type: String },
    vehicle: { type: String },
    details: { type: String },
    shared: { type: Boolean },
});
const flightSchema = new mongoose.Schema({
    airline: { type: String },
    flightNumber: { type: String },
    dayNumber: { type: Number },
    departure: {
        city: { type: String },
        dateTime: { type: Date },
        time: { type: String },
    },
    arrival: {
        city: { type: String },
        dateTime: { type: Date },
        time: { type: String },
    },
    duration: { type: String },
    layovers: [
        {
            location: { type: String },
            duration: { type: String },
        },
    ],
    baggage: {
        checkInKg: { type: Number },
        cabinKg: { type: Number },
    },
    price: { type: Number },
    currency: { type: String },
});
const travelersSchema = new mongoose.Schema({
    adults: { type: Number },
    children: { type: Number },
});
const packageSchema = new mongoose.Schema({
    title: { type: String },
    isLive: { type: Boolean, default: false },
    keywords: { type: [String] },
    days: { type: Number },
    nights: { type: Number },
    imageUrl: { type: [String] },
    audioUrl: { type: String },
    summary: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    locations: { type: [String] },
    activities: { type: [String] },
    highlights: { type: [String] },
    description: { type: String },
    travelers: { type: travelersSchema },
    audioSummary: { type: String },
    destination: { type: String },
    itinerary: { type: [itinerarySchema] },
    accommodation: { type: [accommodationSchema] },
    transportation: { type: [transportationSchema] },
    flights: { type: [flightSchema] }, // <-- added flights schema entry
    inclusions: { type: [String] },
    exclusions: { type: [String] },
    notes: { type: [String] },
    bookingDeadline: { type: Date },
    packageUrl: { type: String },
    isProcessed: { type: Boolean },
    priceData: [
        {
            price: { type: Number },
            type: { type: String, enum: ["Adult", "Child"] },
            currency: { type: String },
            details: { type: String },
        },
    ],
    price: {
        threeStar: { type: Number },
        fourStar: { type: Number },
        fiveStar: { type: Number },
        currency: { type: String },
    },
    visa: [
        {
            price: { type: Number },
            type: { type: String, enum: ["Adult", "Child"] },
            currency: { type: String },
            details: { type: String },
        },
    ],
    defaultCurrency: { type: String },
}, { timestamps: true });
const Package = mongoose.models.Package || mongoose.model("Package", packageSchema);
export default Package;
