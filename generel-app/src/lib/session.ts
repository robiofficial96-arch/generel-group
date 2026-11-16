import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Session user for a protected page; sends anonymous visitors to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Session user for an admin page; non-admins go back to their dashboard. */
export async function requireAdminUser() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
