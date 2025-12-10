/**
 * Query/Booking Model
 * @description Defines the Mongoose schema and model for customer queries/bookings
 * @interface IQuery - TypeScript interface for the Query document structure.
 * @schema querySchema - Mongoose schema enforcing data validation and structure.
 * @model Query - The compiled Mongoose model for interacting with the Query collection in MongoDB.
 * @returns {mongoose.Model<IQuery>} The Query model instance.
 */
import mongoose from "mongoose";

export interface IMoney {
  amount: number;
  currency: string;
}

export interface IQueryPaymentData {
  destination: string;
  buy: IMoney; // B2B
  sell: IMoney; // B2C
  netMargin: IMoney; // sell - buy, currency aligned with sell.currency
  advance: IMoney;
  paidToVendor: IMoney;
  pendingOnArrival: IMoney;
  paymentDone: boolean;
  tripEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  reviewer?: mongoose.Types.ObjectId; // Reference to User or Customer
  rating: number; // e.g., 1 to 5
  text: string; // review text
  images?: string[]; // array of image URLs
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // or "Customer" based on your design
    },
    rating: { type: Number },
    text: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const moneySchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    currency: {
      type: String,
    },
  },
  { _id: false }
);

export interface IQuery {
  _id: string;
  customers?: mongoose.Types.ObjectId[]; // Array of customer references
  package?: mongoose.Types.ObjectId[]; // Package reference
  primaryPackage?: mongoose.Types.ObjectId; // Primary Package reference
  primaryCustomer?: mongoose.Types.ObjectId; // Primary Customer reference
  paymentRequests?: IPaymentRequest[];
  paymentData?: IQueryPaymentData;
  status?: string;
  isBooked?: boolean;
  payments?: IPayment[];
  reviews?: IReview;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  createdAt: Date;

  updatedAt: Date;
}

export const QueryPaymentDataSchema = new mongoose.Schema<IQueryPaymentData>(
  {
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
  },
  { timestamps: true }
);

export interface IPayment {
  paymentId?: string;
  packageId?: mongoose.Types.ObjectId | string;
  status?: string;
  customerEmail?: string;
  customerName?: string;
  amount?: number;
  currency?: string;
  paymentDate?: Date;
  paymentMethod?: string; // e.g., "Credit Card", "Bank Transfer", "Cash"
  transactionId?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface IPaymentRequest {
  packageId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  isPaid: boolean;
  paymentId?: string;
}

const paymentRequestSchema = new mongoose.Schema<IPaymentRequest>({
  packageId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  customerEmail: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  isPaid: { type: Boolean },
  paymentId: { type: String },
});

const paymentSchema = new mongoose.Schema<IPayment>({
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
  },
  { timestamps: true }
);

querySchema.index({ customers: 1 });
querySchema.index({ package: 1 });
querySchema.index({ status: 1 });

const Query: mongoose.Model<IQuery> =
  mongoose.models.Query || mongoose.model<IQuery>("Query", querySchema);

export default Query;
