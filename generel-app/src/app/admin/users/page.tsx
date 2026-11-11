import { prisma } from "@/lib/prisma";
import { createUser } from "./actions";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

export const instant = false;

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { wallet: true, upline: true },
  });

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Users</h1>

      <form action={createUser} className="card mt-6 grid max-w-2xl grid-cols-2 gap-3 p-5">
        <input name="name" placeholder="Name" required className="input-field" />
        <input name="mobile" placeholder="Mobile" required className="input-field" />
        <input name="password" type="password" placeholder="Password" required className="input-field" />
        <select name="role" className="input-field">
          <option value="CUSTOMER">Customer</option>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>

        <input
          name="uplineMobile"
          placeholder="Upline Mobile (optional, root user হলে খালি রাখো)"
          className="input-field col-span-2"
        />
        <select name="side" defaultValue="" className="input-field col-span-2">
          <option value="">-- Placement Side (upline দিলে বাধ্যতামূলক) --</option>
          <option value="LEFT">Left</option>
          <option value="RIGHT">Right</option>
        </select>

        <button className="btn-primary col-span-2">Create User</button>
      </form>

      <div className="card mt-6 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Upline</th>
              <th>Side</th>
              <th>G-Wallet</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td>{u.upline?.mobile ?? "-"}</td>
                <td>{u.placedSide ?? "-"}</td>
                <td className="tabular-nums">{u.wallet?.gWallet.toString() ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
