/**
 * Query/Booking Model
 * @description Defines the Mongoose schema and model for customer queries/bookings
 * @interface IQuery - TypeScript interface for the Query document structure.
 * @schema querySchema - Mongoose schema enforcing data validation and structure.
 * @model Query - The compiled Mongoose model for interacting with the Query collection in MongoDB.
 * @returns {mongoose.Model<IQuery>} The Query model instance.
 */
import mongoose from "mongoose";
import dbConnect from "./connection.js";

export interface IQuery {
  _id: string;
  customers?: mongoose.Types.ObjectId[]; // Array of customer references
  package?: mongoose.Types.ObjectId[]; // Package reference
  primaryPackage?: mongoose.Types.ObjectId; // Primary Package reference
  status?: string;
  isBooked?: boolean;
  payments?: IPayment[];
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>({
  amount: { type: Number },
  currency: { type: String },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String },
  transactionId: { type: String },
  receiptUrl: { type: String },
  notes: { type: String },
});
export interface IPayment {
  amount?: number;
  currency?: string;
  paymentDate?: Date;
  paymentMethod?: string; // e.g., "Credit Card", "Bank Transfer", "Cash"
  transactionId?: string;
  receiptUrl?: string;
  notes?: string;
}

const querySchema = new mongoose.Schema<IQuery>(
  {
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
  },
  { timestamps: true }
);

querySchema.index({ customers: 1 });
querySchema.index({ package: 1 });
querySchema.index({ status: 1 });

const Query: mongoose.Model<IQuery> =
  mongoose.models.Query || mongoose.model<IQuery>("Query", querySchema);

export default Query;
