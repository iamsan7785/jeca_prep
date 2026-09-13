import { describe, expect, it, vi } from "vitest";
import { ensureDbUser } from "./userSync.js";

describe("ensureDbUser", () => {
  it("creates the missing role and inserts the user when the Prisma user is absent", async () => {
    const roleUpsert = vi.fn().mockResolvedValue({ id: "role-student", name: "STUDENT" });
    const userUpsert = vi.fn().mockResolvedValue({ id: "user-1", email: "student@example.com" });

    const result = await ensureDbUser(
      {
        role: { upsert: roleUpsert },
        user: { upsert: userUpsert },
      } as any,
      {
        id: "user-1",
        name: "Student User",
        email: "student@example.com",
        role: "STUDENT",
        passwordHash: "hash-from-auth",
      },
    );

    expect(roleUpsert).toHaveBeenCalledWith({
      where: { name: "STUDENT" },
      update: {},
      create: { name: "STUDENT" },
    });
    expect(userUpsert).toHaveBeenCalledWith({
      where: { id: "user-1" },
      update: {
        email: "student@example.com",
        name: "Student User",
        roleId: "role-student",
        passwordHash: "hash-from-auth",
      },
      create: {
        id: "user-1",
        name: "Student User",
        email: "student@example.com",
        passwordHash: "hash-from-auth",
        roleId: "role-student",
      },
    });
    expect(result).toEqual({ id: "user-1", email: "student@example.com" });
  });
});
