export const currentDateTimeTool = {
  type: "function",
  name: "get_current_datetime",
  description: "Get the current date and time in a requested IANA time zone. Use UTC when no zone is given.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      timeZone: { type: "string", description: "IANA time zone, such as UTC or Asia/Kolkata." },
    },
    required: ["timeZone"],
    additionalProperties: false,
  },
} as const;
