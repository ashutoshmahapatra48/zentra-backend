import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateConversationId } from "../conversations/conversation.validation.js";
import { streamAnswer } from "./openai.service.js";

type StreamCallbacks = { onStart: (conversationId: string) => void; onDelta: (delta: string) => void };

/** Starts a conversation or appends to an owned one, then streams its reply. */
export async function sendMessage(userId: string, conversationId: string | null, content: string, callbacks: StreamCallbacks) {
  if (conversationId !== null) return continueConversation(userId, conversationId, content, callbacks);
  const title = content.split(/\s+/).slice(0, 8).join(" ").slice(0, 80);
  const conversation = await Conversation.create({ userId, title });
  await Message.create({ conversationId: conversation.id, role: "user", content });
  callbacks.onStart(conversation.id);
  return createAssistantReply(conversation.id, callbacks.onDelta);
}

/** Verifies ownership before saving a new user message to a conversation. */
async function continueConversation(userId: string, rawId: string, content: string, callbacks: StreamCallbacks) {
  const conversationId = validateConversationId(rawId);
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  await Message.create({ conversationId, role: "user", content });
  conversation.updatedAt = new Date();
  await conversation.save();
  callbacks.onStart(conversationId);
  return createAssistantReply(conversationId, callbacks.onDelta);
}

/** Builds bounded model context and stores the completed assistant response. */
async function createAssistantReply(conversationId: string, onDelta: (delta: string) => void) {
  const history = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(20).lean();
  const content = await streamAnswer(history.reverse().map(({ role, content }) => ({ role, content })), onDelta);
  const message = await Message.create({ conversationId, role: "assistant", content });
  return { conversationId, message };
}
