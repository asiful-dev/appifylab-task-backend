import { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms${
        req.user ? ` - User: ${req.user.id}` : ""
      }`,
    );
  });

  next();
};
