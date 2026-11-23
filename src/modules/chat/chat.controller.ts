import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import * as service from "./chat.service.js";
import { chatRequestSchema } from "./chat.validation.js";

/** Validates a chat request and streams its lifecycle as SSE events. */
export async function chat(req: Request, res: Response) {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Provide a conversationId (or null for a new conversation) and a message between 1 and 12000 characters", parsed.error.issues);
  beginStream(res);
  try {
    const result = await service.sendMessage(req.userId!, parsed.data.conversationId, parsed.data.content, {
      onStart: (conversationId, title) => sendEvent(res, "start", { conversationId, title }),
      onTitle: (title) => sendEvent(res, "title", { title }),
      onDelta: (delta) => sendEvent(res, "delta", { delta }),
      onTool: (name, status) => sendEvent(res, "tool", { name, status }),
    });
    sendEvent(res, "complete", { success: true, message: "Response generated", data: result });
    res.end();
  } catch (error) { sendStreamError(res, error); }
}

/** Sets headers required for an unbuffered Server-Sent Events response. */
function beginStream(res: Response) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

/** Writes one named SSE event while the client connection remains open. */
function sendEvent(res: Response, event: string, data: unknown) {
  if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Serializes failures using the normal API error shape inside the stream. */
function sendStreamError(res: Response, error: unknown) {
  console.error("Streaming chat failed:", error);
  const apiError = error instanceof ApiError ? error : new ApiError(500, "An unexpected server error occurred");
  sendEvent(res, "error", { success: false, message: apiError.message, errors: apiError.errors });
  res.end();
}
