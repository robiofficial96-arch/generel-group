import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Everything the proxy matcher covers requires a signed-in user; /admin
// additionally requires the ADMIN role (hidden from customers).
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
      const user = auth?.user;
      if (!user) return false;

      if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return true;
    },
  },
};
