import { z } from "zod";

const inputSchema = z.object({ timeZone: z.string().min(1).max(100) }).strict();

/** Returns a localized current date/time for a valid IANA time zone. */
export async function getCurrentDateTime(args: unknown): Promise<string> {
  const { timeZone } = inputSchema.parse(args);
  const now = new Date();
  return JSON.stringify({
    iso: now.toISOString(),
    timeZone,
    local: new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone,
    }).format(now),
  });
}
