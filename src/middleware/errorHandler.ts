import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errorTypes";
import { env } from "../config/env";

/**
 * Global error handler middleware
 * Must be registered last in Express app
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("[Error Handler]", {
    message: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    path: req.path,
    method: req.method,
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.name,
        message: error.message,
      },
    });
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      ...(env.NODE_ENV === "development" && { details: error.message }),
    },
  });

  return;
};
