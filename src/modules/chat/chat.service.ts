import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { MessageRole } from "../../constants/message.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateConversationId } from "../conversations/conversation.validation.js";
import { generateConversationTitle, streamAnswer } from "../../ai/assistant.service.js";

type StreamCallbacks = {
  onStart: (conversationId: string, title: string) => void;
  onTitle: (title: string) => void;
  onDelta: (delta: string) => void;
  onTool: (name: string, status: "started" | "completed") => void;
};

/** Starts a conversation or appends to an owned one, then streams its reply. */
export async function sendMessage(userId: string, conversationId: string | null, content: string, callbacks: StreamCallbacks) {
  if (conversationId !== null) return continueConversation(userId, conversationId, content, callbacks);
  const title = content.split(/\s+/).slice(0, 8).join(" ").slice(0, 80);
  const conversation = await Conversation.create({ userId, title });
  await Message.create({ conversationId: conversation.id, role: MessageRole.User, content });
  callbacks.onStart(conversation.id, title);
  const result = await createAssistantReply(conversation.id, callbacks);
  conversation.title = await generateConversationTitle(content, result.message.content, title);
  await conversation.save();
  callbacks.onTitle(conversation.title);
  return result;
}

/** Verifies ownership before saving a new user message to a conversation. */
async function continueConversation(userId: string, rawId: string, content: string, callbacks: StreamCallbacks) {
  const conversationId = validateConversationId(rawId);
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  await Message.create({ conversationId, role: MessageRole.User, content });
  conversation.updatedAt = new Date();
  await conversation.save();
  callbacks.onStart(conversationId, conversation.title);
  return createAssistantReply(conversationId, callbacks);
}

/** Builds bounded model context and stores the completed assistant response. */
async function createAssistantReply(conversationId: string, callbacks: Pick<StreamCallbacks, "onDelta" | "onTool">) {
  const history = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(20).lean();
  const completion = await streamAnswer(
    history.reverse().map(({ role, content }) => ({ role, content })),
    callbacks,
  );
  const message = await Message.create({
    conversationId,
    role: MessageRole.Assistant,
    content: completion.content,
    model: completion.model,
    usage: completion.usage,
    latency: completion.latency,
    status: completion.status,
    toolCalls: completion.toolCalls,
  });
  return { conversationId, message };
}
