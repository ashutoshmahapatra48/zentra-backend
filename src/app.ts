import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { conversationRoutes } from "./modules/conversations/conversation.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { sendSuccess } from "./utils/SuccessResponse.js";

export const app = express();
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === config.frontendOrigin) callback(null, true);
    else callback(new ApiError(403, "This origin is not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());
app.use("/api", rateLimit);
app.get("/api/health", (_req, res) => sendSuccess(res, { status: "ok" }, "API healthy"));
app.use("/api/auth", authRoutes);
app.use("/api/conversations", requireAuth, conversationRoutes);
app.use("/api/chat", requireAuth, chatRoutes);
app.use((_req, _res, next) => next(new ApiError(404, "Route not found")));
app.use(errorHandler);
