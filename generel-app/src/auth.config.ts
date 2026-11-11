import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mobile = user.mobile;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.mobile = token.mobile as string;
      return session;
    },
    authorized: ({ auth, request }) => {
      const pathname = request.nextUrl.pathname;
      const needsAuth =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/agent") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/deposit") ||
        pathname.startsWith("/invest") ||
        pathname.startsWith("/withdraw") ||
        pathname.startsWith("/transfer") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/refer");

      if (!needsAuth) return true;

      const user = auth?.user;
      if (!user) return false;

      if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (
        pathname.startsWith("/agent") &&
        user.role !== "AGENT" &&
        user.role !== "ADMIN"
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
  },
};
