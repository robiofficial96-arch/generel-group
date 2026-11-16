import { prisma } from "@/lib/prisma";
import ShellFrame from "./ShellFrame";

type SessionUser =
  | { id?: string; name?: string | null; role?: string; mobile?: string }
  | null
  | undefined;

/**
 * Authenticated application frame. Customer and admin get separate navigation
 * hierarchies (see lib/nav.ts); admin-only links are never sent to customers.
 */
export default async function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const isAdmin = user?.role === "ADMIN";

  const [record, pendingDeposits, pendingWithdrawals, openTickets] = await Promise.all([
    user?.id
      ? prisma.user.findUnique({ where: { id: user.id }, select: { name: true, mobile: true, status: true } })
      : null,
    isAdmin ? prisma.deposit.count({ where: { status: "PENDING" } }) : 0,
    isAdmin ? prisma.withdrawal.count({ where: { status: "PENDING" } }) : 0,
    isAdmin ? prisma.supportTicket.count({ where: { status: "OPEN" } }) : 0,
  ]);

  return (
    <ShellFrame
      user={{
        name: record?.name ?? user?.name ?? "User",
        mobile: record?.mobile ?? user?.mobile ?? "",
        role: user?.role ?? "CUSTOMER",
        status: record?.status ?? "NORMAL",
      }}
      badges={{ approvals: pendingDeposits + pendingWithdrawals, tickets: openTickets }}
    >
      {children}
    </ShellFrame>
  );
}
