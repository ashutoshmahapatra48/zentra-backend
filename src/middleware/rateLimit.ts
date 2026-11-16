import type { RequestHandler } from "express";

const windowMs = 60_000;
const maxRequests = 60;
const requests = new Map<string, { start: number; count: number }>();

/** Limits each client IP to a fixed number of API requests per minute. */
export const rateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || "unknown";
  const current = requests.get(key);
  if (!current || now - current.start >= windowMs) {
    requests.set(key, { start: now, count: 1 });
    return next();
  }
  current.count += 1;
  if (current.count > maxRequests) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ success: false, message: "Too many requests. Try again shortly", errors: [] });
  }
  next();
};
