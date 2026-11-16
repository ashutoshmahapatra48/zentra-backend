import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

/** Converts thrown errors into the API's standard error response envelope. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    res.status(413).json({ success: false, message: "Request body is too large", errors: [] });
    return;
  }
  if (error instanceof SyntaxError && (error as SyntaxError & { status?: number }).status === 400) {
    res.status(400).json({ success: false, message: "Request body must be valid JSON", errors: [] });
    return;
  }
  const apiError = error instanceof ApiError ? error : new ApiError(500, "An unexpected server error occurred");
  if (apiError.statusCode >= 500) console.error(error);
  res.status(apiError.statusCode).json({ success: false, message: apiError.message, errors: apiError.errors });
};
