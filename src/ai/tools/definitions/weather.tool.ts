export const weatherTool = {
  type: "function",
  name: "get_current_weather",
  description:
    "Get current weather conditions for a specified location. Supports current weather only, not historical weather or future forecasts.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City or place name.",
      },
      temperatureUnit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
      },
    },
    required: ["location", "temperatureUnit"],
    additionalProperties: false,
  },
} as const;