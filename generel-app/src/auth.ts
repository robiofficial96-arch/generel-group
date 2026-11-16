import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifiedLogins } from "@/lib/webauthn";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const mobile = credentials?.mobile as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!mobile || !password) return null;

        const user = await prisma.user.findUnique({ where: { mobile } });
        if (!user || user.isBlocked) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "passkey",
      name: "Passkey",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
      },
      authorize: async (credentials) => {
        const mobile = credentials?.mobile as string | undefined;
        if (!mobile) return null;

        const verified = verifiedLogins.get(mobile);
        if (!verified || verified.expiresAt < Date.now()) return null;
        verifiedLogins.delete(mobile);

        const user = await prisma.user.findUnique({ where: { id: verified.userId } });
        if (!user || user.isBlocked) return null;

        return {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
        };
      },
    }),
  ],
});
