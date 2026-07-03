import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/db";
import type { AuthProvider } from "./types";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const localAuthProvider: AuthProvider = {
  async authenticate(username, password) {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    const token     = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.create({ data: { token, userId: user.id, expiresAt } });

    return token;
  },

  async resolveSession(token) {
    const prisma = await getPrisma();
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
      return null;
    }

    return session.userId;
  },

  async invalidate(token) {
    const prisma = await getPrisma();
    await prisma.session.delete({ where: { token } }).catch(() => {});
  },

  async changePassword(userId, newPassword) {
    const prisma = await getPrisma();
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  },
};
