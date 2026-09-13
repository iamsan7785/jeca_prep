import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { mockTestsRouter } from "./routes/mockTests.js";
import { pyqRouter } from "./routes/pyq.js";
import { examsRouter } from "./routes/exams.js";
import { questionsRouter } from "./routes/questions.js";
import { userDataRouter } from "./routes/userData.js";
import { bootstrapDefaultAdmin } from "./services/adminBootstrap.js";
import { hydrateQuestionBankFromDatabase } from "./services/store.js";

export const app = express();
const allowedOrigins = new Set(env.frontendUrls);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, max: 80, standardHeaders: true, legacyHeaders: false }), authRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/pyq", pyqRouter);
app.use("/api/mock-tests", mockTestsRouter);
app.use("/api/exams", examsRouter);
app.use("/api", userDataRouter);
app.use("/api/admin", adminRouter);
bootstrapDefaultAdmin().catch((error) => {
  console.warn("Default admin bootstrap failed:", error);
});
hydrateQuestionBankFromDatabase();
app.get("/api/health", (_request, response) => response.json({ status: "ok", storage: "postgresql" }));
app.use(notFound);
app.use(errorHandler);
