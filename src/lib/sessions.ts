import jwt from "jsonwebtoken";
import type { Response } from "express";
import { config } from "../config/env.js";

const cookieOptions = { httpOnly: true, secure: config.nodeEnv === "production", sameSite: "lax" as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };

/** Issues the signed session token as an HTTP-only cookie. */
export function setSession(res: Response, userId: string) {
  res.cookie("session", jwt.sign({}, config.jwtSecret, { subject: userId, expiresIn: "7d" }), cookieOptions);
}

/** Clears the browser's session cookie using the same cookie path and policy. */
export function clearSession(res: Response) {
  res.clearCookie("session", { ...cookieOptions, maxAge: undefined });
}
