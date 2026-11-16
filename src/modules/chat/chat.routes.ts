import { Router } from "express";
import * as controller from "./chat.controller.js";

export const chatRoutes = Router();
chatRoutes.post("/", controller.chat);
