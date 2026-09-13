import "dotenv/config";

const defaultFrontendUrls = ["http://localhost:5173", "http://localhost:5174"];

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-only-change-me",
  frontendUrl: process.env.FRONTEND_URL ?? defaultFrontendUrls[0],
  frontendUrls: (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : defaultFrontendUrls).map((value) => value.trim()).filter(Boolean),
  nodeEnv: process.env.NODE_ENV ?? "development",
  aiProvider: process.env.AI_PROVIDER ?? "none",
  aiMinConfidence: Number(process.env.AI_MIN_CONFIDENCE ?? 0.8),
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
};

if (env.nodeEnv === "production" && env.jwtSecret === "development-only-change-me") {
  throw new Error("JWT_SECRET must be configured in production.");
}
