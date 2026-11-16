import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/wallets/:path*",
    "/activity/:path*",
    "/deposit/:path*",
    "/invest/:path*",
    "/withdraw/:path*",
    "/transfer/:path*",
    "/commissions/:path*",
    "/team/:path*",
    "/matching/:path*",
    "/profile/:path*",
    "/support/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};
