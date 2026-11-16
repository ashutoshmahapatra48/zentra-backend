import bcrypt from "bcryptjs";

/** Stores passwords as bcrypt hashes with a cost factor of 12. */
export const hashPassword = (password: string) => bcrypt.hash(password, 12);

/** Checks a submitted password against its stored bcrypt hash. */
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
