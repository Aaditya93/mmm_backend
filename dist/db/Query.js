/**
 * Query/Booking Model
 * @description Defines the Mongoose schema and model for customer queries/bookings
 * @interface IQuery - TypeScript interface for the Query document structure.
 * @schema querySchema - Mongoose schema enforcing data validation and structure.
 * @model Query - The compiled Mongoose model for interacting with the Query collection in MongoDB.
 * @returns {mongoose.Model<IQuery>} The Query model instance.
 */
import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema({
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
    primaryPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
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
