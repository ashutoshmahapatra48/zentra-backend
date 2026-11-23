import { ZodError } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { toolRegistry } from "./tool.registry.js";
import type { ToolCallRecord } from "./tool.types.js";

/** Validates tool arguments and runs only functions registered by the backend. */
export async function executeTool(name: string, rawArguments: string): Promise<ToolCallRecord> {
  const handler = toolRegistry[name];
  if (!handler) throw new ApiError(400, `Unsupported tool: ${name}`);

  let args: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawArguments);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected an object");
    args = parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, `Invalid arguments for tool: ${name}`);
  }

  try {
    return { name, arguments: args, result: await handler(args) };
  } catch (error) {
    const message = error instanceof ZodError ? "The tool arguments were invalid." : "The tool could not complete the request.";
    return { name, arguments: args, result: JSON.stringify({ error: message }) };
  }
}
