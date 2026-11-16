import OpenAI from "openai";
import { config } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey, timeout: 60_000 }) : null;

/** Streams generated text to the client and returns the completed answer. */
export async function streamAnswer(
  messages: { role: "user" | "assistant"; content: string }[],
  onDelta: (text: string) => void,
) {
  if (!client) throw new ApiError(503, "Chat is not configured. Add OPENAI_API_KEY to the backend environment");
  try {
    const stream = await client.responses.create({ model: config.openaiModel, input: messages, stream: true });
    let content = "";
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        content += event.delta;
        onDelta(event.delta);
      }
    }
    content = content.trim();
    if (!content) throw new ApiError(502, "The model returned an empty response. Please try again");
    return content;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("OpenAI request failed:", error);
    if (error instanceof OpenAI.APIError) {
      throw new ApiError(error.status === 429 ? 429 : 502, error.status === 429 ? "The model is busy or API quota is unavailable" : "The model could not answer this request");
    }
    throw new ApiError((error as Error).name === "APIConnectionTimeoutError" ? 504 : 502, "Unable to get a response from the model");
  }
}
