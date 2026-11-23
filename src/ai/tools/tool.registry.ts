import type OpenAI from "openai";
import { currentDateTimeTool } from "./definitions/currentDateTime.tool.js";
import { weatherTool } from "./definitions/weather.tool.js";
import { getCurrentDateTime } from "./handlers/currentDateTime.handler.js";
import { getWeather } from "./handlers/weather.handler.js";
import type { ToolHandler } from "./tool.types.js";

export const toolDefinitions: OpenAI.Responses.FunctionTool[] = [
  currentDateTimeTool,
  weatherTool,
];

/** Maps model-visible tool names to the only application functions they may invoke. */
export const toolRegistry: Record<string, ToolHandler> = {
  get_current_datetime: getCurrentDateTime,
  get_current_weather: getWeather,
};
