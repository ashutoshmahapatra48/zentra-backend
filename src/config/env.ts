export const config = {
  port: Number(process.env.PORT) || 4001,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-nano",
  nodeEnv: process.env.NODE_ENV || "development",
};

if (!config.jwtSecret) throw new Error("JWT_SECRET is required");
