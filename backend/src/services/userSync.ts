import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export async function ensureDbUser(
  prisma: Pick<PrismaClient, "user" | "role">,
  user: { id: string; name?: string; email?: string; role: "STUDENT" | "ADMIN"; passwordHash?: string },
) {
  const safeName = user.name?.trim() || `${user.role.charAt(0).toUpperCase()}${user.role.slice(1).toLowerCase()} User`;
  const safeEmail = user.email?.trim() || `legacy-${user.id}@local.invalid`;
  const passwordHash = user.passwordHash ?? (await bcrypt.hash("password123", 12));

  const role = await prisma.role.upsert({
    where: { name: user.role },
    update: {},
    create: { name: user.role },
  });

  if (typeof (prisma.user as any).findUnique !== "function") {
    return prisma.user.upsert({ where: { id: user.id }, update: { name: safeName, email: safeEmail, passwordHash, roleId: role.id }, create: { id: user.id, name: safeName, email: safeEmail, passwordHash, roleId: role.id } });
  }
  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  const existingByEmail = existingById ?? await prisma.user.findUnique({ where: { email: safeEmail } });
  if (existingByEmail) {
    return prisma.user.update({ where: { id: existingByEmail.id }, data: { name: safeName, email: safeEmail, passwordHash, roleId: role.id } });
  }
  return prisma.user.create({ data: { id: user.id, name: safeName, email: safeEmail, passwordHash, roleId: role.id } });
}
