import { z } from "zod";
import { getCurrentWeather } from "../../../providers/weather.provider.js";

const inputSchema = z.object({
  location: z.string().trim().min(1).max(120),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]),
}).strict();

/** Validates a model weather request before passing it to the provider. */
export async function getWeather(args: unknown): Promise<string> {
  const input = inputSchema.parse(args);
  return JSON.stringify(await getCurrentWeather(input.location, input.temperatureUnit));
}
