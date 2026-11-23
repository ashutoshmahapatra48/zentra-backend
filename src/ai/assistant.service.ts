import OpenAI from "openai";
import { config } from "../config/env.js";
import { MessageRole } from "../constants/message.js";
import { systemPrompt } from "./systemPrompt.js";
import { executeTool } from "./tools/tool.executor.js";
import { toolDefinitions } from "./tools/tool.registry.js";
import type { ToolCallRecord } from "./tools/tool.types.js";
import { ApiError } from "../utils/ApiError.js";

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey, timeout: 60_000 }) : null;
const MAX_TOOL_ROUNDS = 4;

type ModelInput = { role: MessageRole; content: string }[];
type StreamCallbacks = {
  onDelta: (text: string) => void;
  onTool: (name: string, status: "started" | "completed") => void;
};

/** Streams assistant text while executing approved function tools as needed. */
export async function streamAnswer(messages: ModelInput, callbacks: StreamCallbacks) {
  if (!client) throw new ApiError(503, "Chat is not configured. Add OPENAI_API_KEY to the backend environment");
  const startedAt = Date.now();
  const input: OpenAI.Responses.ResponseInputItem[] = messages.map(({ role, content }) => ({ role, content }));
  const toolCalls: ToolCallRecord[] = [];
  let content = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const stream = await client.responses.create({
        model: config.openaiModel,
        instructions: systemPrompt,
        tools: toolDefinitions,
        input,
        stream: true,
      });
      let completedResponse: OpenAI.Responses.Response | undefined;

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          content += event.delta;
          callbacks.onDelta(event.delta);
        }
        if (event.type === "response.completed") {
          completedResponse = event.response;
          inputTokens += event.response.usage?.input_tokens || 0;
          outputTokens += event.response.usage?.output_tokens || 0;
        }
      }

      if (!completedResponse || completedResponse.status !== "completed") {
        throw new ApiError(502, "The model response did not complete successfully");
      }
      const functionCalls = completedResponse.output.filter((item) => item.type === "function_call");
      if (functionCalls.length === 0) break;
      if (round === MAX_TOOL_ROUNDS) throw new ApiError(502, "The assistant reached the tool-call limit");

      input.push(...completedResponse.output);
      for (const call of functionCalls) {
        callbacks.onTool(call.name, "started");
        const result = await executeTool(call.name, call.arguments);
        toolCalls.push(result);
        callbacks.onTool(call.name, "completed");
        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: result.result,
        });
      }
    }

    content = content.trim();
    if (!content) throw new ApiError(502, "The model returned an empty response. Please try again");
    return {
      content,
      model: config.openaiModel,
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
      latency: Date.now() - startedAt,
      status: "completed" as const,
      toolCalls,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("OpenAI request failed:", error);
    if (error instanceof OpenAI.APIError) {
      throw new ApiError(error.status === 429 ? 429 : 502, error.status === 429 ? "The model is busy or API quota is unavailable" : "The model could not answer this request");
    }
    throw new ApiError((error as Error).name === "APIConnectionTimeoutError" ? 504 : 502, "Unable to get a response from the model");
  }
}

/** Creates a short conversation title, falling back to the supplied prompt title on failure. */
export async function generateConversationTitle(
  userMessage: string,
  assistantMessage: string,
  fallbackTitle: string,
): Promise<string> {
  if (!client) return fallbackTitle;

  try {
    const response = await client.responses.create({
      model: config.openaiModel,
      instructions: "Write a concise chat title of 2 to 6 words. Return only the title, with no quotes or punctuation at the end.",
      input: `User message:\n${userMessage.slice(0, 1500)}\n\nAssistant response:\n${assistantMessage.slice(0, 1500)}`,
      max_output_tokens: 24,
    });
    const title = response.output_text
      ?.split("\n")[0]
      .replace(/^\s*title:\s*/i, "")
      .replace(/^["'`#*\s]+|["'`*\s]+$/g, "")
      .trim()
      .slice(0, 80);
    return title || fallbackTitle;
  } catch (error) {
    console.error("Conversation title generation failed:", error);
    return fallbackTitle;
  }
}
