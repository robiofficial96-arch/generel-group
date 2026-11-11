import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/dashboard/:path*",
    "/deposit/:path*",
    "/invest/:path*",
    "/withdraw/:path*",
    "/transfer/:path*",
    "/settings/:path*",
    "/refer/:path*",
  ],
};
