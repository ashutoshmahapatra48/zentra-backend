import { Schema, model, type InferSchemaType } from "mongoose";
import { MessageRole } from "../constants/message.js";

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  role: { type: String, enum: Object.values(MessageRole), required: true },
  content: { type: String, required: true, maxlength: 12000 },
  model: { type: String, trim: true },
  usage: {
    inputTokens: { type: Number, min: 0 },
    outputTokens: { type: Number, min: 0 },
    totalTokens: { type: Number, min: 0 },
  },
  latency: { type: Number, min: 0 },
  status: { type: String, enum: ["completed", "failed"] },
  toolCalls: [{
    name: { type: String, required: true },
    arguments: { type: Schema.Types.Mixed, required: true },
    result: { type: String, required: true },
  }],
}, { timestamps: true });
messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const Message = model("Message", messageSchema);
