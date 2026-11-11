import { signOut } from "@/auth";
import NavLink from "./NavLink";

type ShellUser = {
  name?: string | null;
  role?: string;
  mobile?: string;
} | null | undefined;

export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
              G
            </span>
            <span className="font-semibold">Generel App</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-[var(--muted)] leading-tight">
                  {user.mobile} · {user.role}
                </p>
              </div>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="btn-outline px-3 py-1.5 text-sm">Logout</button>
            </form>
          </div>
        </div>

        {user && (
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/refer">Refer</NavLink>
            <NavLink href="/deposit">Deposit</NavLink>
            <NavLink href="/invest">Invest</NavLink>
            <NavLink href="/withdraw">Withdraw</NavLink>
            <NavLink href="/transfer">Transfer</NavLink>
            <NavLink href="/settings/pin">PIN</NavLink>
            <NavLink href="/settings/passkey">Fingerprint</NavLink>
            {isAdmin && (
              <>
                <span className="mx-1 self-center text-[var(--border-color)]">|</span>
                <NavLink href="/admin/users">Users</NavLink>
                <NavLink href="/admin/deposits">Deposits</NavLink>
                <NavLink href="/admin/withdrawals">Withdrawals</NavLink>
                <NavLink href="/admin/roi">ROI</NavLink>
                <NavLink href="/admin/rewards">Rewards</NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
