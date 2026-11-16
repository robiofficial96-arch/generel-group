import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import PasskeyRegisterButton from "./PasskeyRegisterButton";
import { deletePasskey } from "./actions";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const instant = false;

export default async function PasskeySettingsPage() {
  const sessionUser = await requireUser();
  const passkeys = await prisma.passkey.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={sessionUser}>
      <PageHeader
        title="Fingerprint Login"
        subtitle="Device-এর fingerprint / Windows Hello দিয়ে সরাসরি login করো।"
        back={{ href: "/profile", label: "Profile" }}
      />

      <div className="grid max-w-3xl items-start gap-5 md:grid-cols-2">
        <Section title="নতুন Device যোগ করো">
          <PasskeyRegisterButton />
        </Section>

        <Section title="Registered Devices" subtitle={`${passkeys.length} টি device`} flush>
          {passkeys.length === 0 ? (
            <EmptyState icon="fingerprint" title="কোনো device নেই" text="এই device-এর fingerprint যোগ করলে এখানে দেখাবে।" />
          ) : (
            <ul>
              {passkeys.map((p) => (
                <li key={p.id} className="tx-row">
                  <span className="tx-icon tone-blue">
                    <Icon name="fingerprint" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.deviceLabel ?? "Device"}</span>
                    <span className="block text-xs text-[var(--muted)]">Added {fmtDate(p.createdAt)}</span>
                  </span>
                  <form action={deletePasskey}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-ghost !text-[var(--danger)]">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
