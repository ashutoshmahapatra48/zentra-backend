import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** Verifies the session cookie and attaches its user ID to the request. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.session;
  if (!token) return next(new ApiError(401, "Please log in to continue"));
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    next(new ApiError(401, "Your session has expired. Please log in again"));
  }
};
