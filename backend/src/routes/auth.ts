import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, signToken } from "../middleware/auth.js";
import { memoryStore } from "../services/store.js";
import { ensureDbUser } from "../services/userSync.js";

const prisma = new PrismaClient();

const credentials = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const parsed = credentials.safeParse(request.body);
  if (!parsed.success || !parsed.data.name) return response.status(400).json({ message: "Enter a name, valid email, and password of at least 8 characters." });
  const email = parsed.data.email.toLowerCase();
  if ([...memoryStore.users.values()].some((user) => user.email === email) || await prisma.user.findUnique({ where: { email }, select: { id: true } })) return response.status(409).json({ message: "An account already exists for this email." });
  const user = { id: randomUUID(), name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "STUDENT" as const, createdAt: new Date() };
  memoryStore.users.set(user.id, user);
  try {
    await ensureDbUser(prisma, { id: user.id, name: user.name, email: user.email, role: user.role, passwordHash: user.passwordHash });
  } catch (error) {
    console.warn("Could not sync auth user to Prisma:", error);
  }
  return response.status(201).json({ user: publicUser(user), token: signToken({ userId: user.id, role: user.role }) });
});

authRouter.post("/login", async (request, response) => {
  const parsed = credentials.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Enter a valid email and password." });
  const email = parsed.data.email.toLowerCase();
  let user = [...memoryStore.users.values()].find((candidate) => candidate.email === email);
  if (!user) {
    const databaseUser = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (databaseUser && await bcrypt.compare(parsed.data.password, databaseUser.passwordHash)) {
      user = { id: databaseUser.id, name: databaseUser.name, email: databaseUser.email, passwordHash: databaseUser.passwordHash, role: databaseUser.role.name === "ADMIN" ? "ADMIN" : "STUDENT", createdAt: databaseUser.createdAt };
      memoryStore.users.set(user.id, user);
    }
  }
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return response.status(401).json({ message: "Email or password is incorrect." });
  try {
    await ensureDbUser(prisma, { id: user.id, name: user.name, email: user.email, role: user.role, passwordHash: user.passwordHash });
  } catch (error) {
    console.warn("Could not sync auth user to Prisma:", error);
  }
  return response.json({ user: publicUser(user), token: signToken({ userId: user.id, role: user.role }) });
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const memoryUser = memoryStore.users.get(request.auth!.userId);
  if (memoryUser) return response.json({ user: publicUser(memoryUser) });
  const databaseUser = await prisma.user.findUnique({ where: { id: request.auth!.userId }, include: { role: true } });
  if (!databaseUser) return response.status(404).json({ message: "User not found." });
  return response.json({ user: publicUser({ id: databaseUser.id, name: databaseUser.name, email: databaseUser.email, role: databaseUser.role.name }) });
});
