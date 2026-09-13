import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { memoryStore } from "./store.js";
import { ensureDbUser } from "./userSync.js";

const prisma = new PrismaClient();

export const DEFAULT_ADMIN_EMAIL = "admin@jeca.com";
export const DEFAULT_ADMIN_PASSWORD = "Admin@1234";

export async function bootstrapDefaultAdmin() {
  const normalizedEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();
  const existing = [...memoryStore.users.values()].find((user) => user.email.toLowerCase() === normalizedEmail);

  if (existing) {
    if (existing.role !== "ADMIN") {
      existing.role = "ADMIN";
      const current = { ...existing, role: "ADMIN" as const };
      memoryStore.users.set(existing.id, current);
      try {
        await ensureDbUser(prisma, { id: existing.id, name: current.name, email: current.email, role: "ADMIN", passwordHash: current.passwordHash });
      } catch (error) {
        console.warn("Could not sync default admin to Prisma:", error);
      }
    }
    return existing;
  }

  const persisted = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { role: true } });
  if (persisted) {
    const user = { id: persisted.id, name: persisted.name, email: persisted.email, passwordHash: persisted.passwordHash, role: persisted.role.name === "ADMIN" ? "ADMIN" as const : "STUDENT" as const, createdAt: persisted.createdAt };
    memoryStore.users.set(user.id, user);
    return user;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
  const user = {
    id: randomUUID(),
    name: "Admin User",
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash,
    role: "ADMIN" as const,
    createdAt: new Date(),
  };

  memoryStore.users.set(user.id, user);

  try {
    await ensureDbUser(prisma, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      passwordHash: user.passwordHash,
    });
  } catch (error) {
    console.warn("Could not sync default admin user to Prisma:", error);
  }

  return user;
}
