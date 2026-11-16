import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";

/** Validates route IDs and treats malformed IDs like missing conversations. */
export function validateConversationId(value: string | string[]): string {
  const id = String(value);
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, "Conversation not found");
  return id;
}
