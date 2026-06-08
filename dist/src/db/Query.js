/**
 * Query/Booking Model
 * @description Defines the Mongoose schema and model for customer queries/bookings
 * @interface IQuery - TypeScript interface for the Query document structure.
 * @schema querySchema - Mongoose schema enforcing data validation and structure.
 * @model Query - The compiled Mongoose model for interacting with the Query collection in MongoDB.
 * @returns {mongoose.Model<IQuery>} The Query model instance.
 */
import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer", // or "Customer" based on your design
    },
    rating: { type: Number },
    text: { type: String },
    images: [{ type: String }],
}, { timestamps: true });
const moneySchema = new mongoose.Schema({
    amount: { type: Number, default: 0 },
    currency: {
        type: String,
    },
}, { _id: false });
export const QueryPaymentDataSchema = new mongoose.Schema({
    destination: { type: String },
    buy: {
        type: moneySchema,
    },
    sell: {
        type: moneySchema,
    },
    netMargin: {
        type: moneySchema,
    },
    advance: {
        type: moneySchema,
    },
    paidToVendor: {
        type: moneySchema,
    },
    pendingOnArrival: {
        type: moneySchema,
    },
    paymentDone: { type: Boolean, default: false },
    tripEnd: { type: Boolean, default: false },
}, { timestamps: true });
const paymentRequestSchema = new mongoose.Schema({
    packageId: { type: String },
    amount: { type: Number },
    currency: { type: String },
    customerEmail: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    isPaid: { type: Boolean },
    paymentId: { type: String },
});
const paymentSchema = new mongoose.Schema({
    paymentId: { type: String },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
    },
    status: { type: String },
    customerEmail: { type: String },
    customerName: { type: String },
    amount: { type: Number },
    currency: { type: String },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String },
    transactionId: { type: String },
    receiptUrl: { type: String },
    notes: { type: String },
});
const querySchema = new mongoose.Schema({
    customers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
    ],
    package: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
        },
    ],
    paymentRequests: [paymentRequestSchema],
    paymentData: { type: QueryPaymentDataSchema },
    primaryPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
    },
    reviews: [reviewSchema],
    primaryCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
    },
    payments: [paymentSchema],
    isBooked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
    },
    priority: {
        type: String,
    },
    notes: { type: String },
}, { timestamps: true });
querySchema.index({ customers: 1 });
querySchema.index({ package: 1 });
querySchema.index({ status: 1 });
const Query = mongoose.models.Query || mongoose.model("Query", querySchema);
export default Query;
