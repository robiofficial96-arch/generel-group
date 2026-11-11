import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PasskeyRegisterButton from "./PasskeyRegisterButton";
import { deletePasskey } from "./actions";
import AppShell from "@/components/AppShell";

export const instant = false;

export default async function PasskeySettingsPage() {
  const session = await auth();
  const passkeys = session?.user
    ? await prisma.passkey.findMany({ where: { userId: session.user.id } })
    : [];

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Fingerprint Login (Passkey)</h1>
      <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
        Device এর fingerprint/Windows Hello দিয়ে পরে সরাসরি লগিন করতে পারবে।
      </p>

      <div className="card mt-5 max-w-sm p-5">
        <PasskeyRegisterButton />
      </div>

      {passkeys.length > 0 && (
        <ul className="mt-4 max-w-sm space-y-2">
          {passkeys.map((p) => (
            <li
              key={p.id}
              className="card flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span>{p.deviceLabel ?? "Device"}</span>
              <form action={deletePasskey}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm text-red-600 hover:underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
