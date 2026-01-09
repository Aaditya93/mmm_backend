import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Unhandled Error Details:");
  console.error("- Path:", req.path);
  console.error("- Method:", req.method);
  console.error("- Message:", err.message);
  console.error("- Stack:", err.stack);

  if (res.headersSent) {
    console.warn("⚠️ Headers already sent, passing error to next middleware");
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  });
};
