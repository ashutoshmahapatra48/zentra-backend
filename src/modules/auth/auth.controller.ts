import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/SuccessResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import * as authService from "./auth.service.js";

/** Validates registration input and returns the created account. */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Please provide a valid name, email, and password", parsed.error.issues);
  const user = await authService.register(parsed.data.fullName, parsed.data.email, parsed.data.password, res);
  return sendSuccess(res, { user }, "Account created", 201);
});

/** Validates login input and returns the authenticated account. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Please provide a valid email and password", parsed.error.issues);
  const user = await authService.login(parsed.data.email, parsed.data.password, res);
  return sendSuccess(res, { user }, "Logged in");
});

/** Ends the current browser session. */
export function logout(_req: Request, res: Response) {
  authService.clearSession(res);
  return sendSuccess(res, null, "Logged out");
}

/** Returns the account associated with the verified session. */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.userId!);
  return sendSuccess(res, { user }, "Current user");
});
