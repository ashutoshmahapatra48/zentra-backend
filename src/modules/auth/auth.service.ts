import type { Response } from "express";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { clearSession, setSession } from "../../lib/sessions.js";

const toUser = (user: { id: string; fullName: string; email: string }) => ({ id: user.id, fullName: user.fullName, email: user.email });

/** Creates a user with a hashed password and starts their session. */
export async function register(fullName: string, emailInput: string, password: string, res: Response) {
  const email = emailInput.toLowerCase();
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({ fullName, email, passwordHash: await hashPassword(password) });
  setSession(res, user.id);
  return toUser(user);
}

/** Verifies credentials and issues a session cookie for the user. */
export async function login(emailInput: string, password: string, res: Response) {
  const user = await User.findOne({ email: emailInput.toLowerCase() }).select("+passwordHash");
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new ApiError(401, "Email or password is incorrect");
  setSession(res, user.id);
  return toUser(user);
}

/** Returns the public profile for the authenticated account. */
export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, "Please log in to continue");
  return toUser(user);
}

export { clearSession };
