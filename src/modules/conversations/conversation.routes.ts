import { Router } from "express";
import * as controller from "./conversation.controller.js";

export const conversationRoutes = Router();
conversationRoutes.get("/", controller.list);
conversationRoutes.get("/:id/messages", controller.messages);
conversationRoutes.delete("/:id", controller.remove);
