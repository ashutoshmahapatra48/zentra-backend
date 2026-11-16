import { z } from "zod";
export const chatRequestSchema = z.object({
  conversationId: z.string().nullable(),
  content: z.string().trim().min(1).max(12000),
});
