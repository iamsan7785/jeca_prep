import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { memoryStore } from "../services/store.js";
import { ensureDbUser } from "../services/userSync.js";
import type { AppRole } from "../types.js";

const prisma = new PrismaClient();

type TokenPayload = { userId: string; role: AppRole };

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ message: "Authentication is required." });
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    request.auth = decoded;

    const memoryUser = memoryStore.users.get(decoded.userId);
    try {
      await ensureDbUser(prisma, memoryUser
        ? {
            id: memoryUser.id,
            name: memoryUser.name,
            email: memoryUser.email,
            role: memoryUser.role,
            passwordHash: memoryUser.passwordHash,
          }
        : {
            id: decoded.userId,
            name: `${decoded.role.charAt(0).toUpperCase()}${decoded.role.slice(1).toLowerCase()} User`,
            email: `legacy-${decoded.userId}@local.invalid`,
            role: decoded.role,
          });
    } catch {
      // Ignore sync failures here; the request should still proceed when the user is otherwise valid.
    }

    const databaseUser = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { role: { select: { name: true } } } }).catch(() => null);
    if (databaseUser) request.auth = { userId: databaseUser.id, role: databaseUser.role.name === "ADMIN" ? "ADMIN" : "STUDENT" };

    return next();
  } catch {
    return response.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (request.auth?.role !== "ADMIN") return response.status(403).json({ message: "Administrator access is required." });
  return next();
}
