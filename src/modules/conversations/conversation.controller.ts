import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/SuccessResponse.js";
import * as service from "./conversation.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => sendSuccess(res, await service.listConversations(req.userId!), "Conversations loaded"));
export const messages = asyncHandler(async (req: Request, res: Response) => sendSuccess(res, await service.getMessages(req.userId!, req.params.id), "Conversation history loaded"));
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteConversation(req.userId!, req.params.id);
  return sendSuccess(res, null, "Conversation deleted");
});
