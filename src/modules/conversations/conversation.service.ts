import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateConversationId } from "./conversation.validation.js";

/** Lists a user's conversations from most recently active to oldest. */
export async function listConversations(userId: string) {
  return Conversation.find({ userId }).sort({ updatedAt: -1 }).select("title createdAt updatedAt").lean();
}

/** Loads history only after confirming the conversation belongs to the user. */
export async function getMessages(userId: string, rawId: string | string[]) {
  const id = validateConversationId(rawId);
  const conversation = await Conversation.findOne({ _id: id, userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  const messages = await Message.find({ conversationId: conversation.id }).sort({ createdAt: 1 }).lean();
  return { conversation, messages };
}

/** Deletes an owned conversation and all of its stored messages. */
export async function deleteConversation(userId: string, rawId: string | string[]) {
  const id = validateConversationId(rawId);
  const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  await Message.deleteMany({ conversationId: conversation.id });
}
