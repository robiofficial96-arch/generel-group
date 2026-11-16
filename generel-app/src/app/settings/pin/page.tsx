import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { setTransactionPin } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ConfirmButton";
import { Flash, PageHeader, Section } from "@/components/ui";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function TransactionPinPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { transactionPinHash: true },
  });
  const hasPin = Boolean(user?.transactionPinHash);

  return (
    <AppShell user={sessionUser}>
      <PageHeader
        title="Transaction PIN"
        subtitle="ID-to-ID transfer confirm করতে এই PIN লাগে।"
        back={{ href: "/profile", label: "Profile" }}
      />
      <Flash ok={ok} error={error} />

      <div className="max-w-md">
        <Section
          title={hasPin ? "PIN পরিবর্তন করো" : "নতুন PIN সেট করো"}
          action={<StatusBadge status={hasPin ? "APPROVED" : "PENDING"} label={hasPin ? "PIN set" : "Not set"} />}
        >
          <form action={setTransactionPin} className="space-y-4">
            <div>
              <label className="label-text" htmlFor="pin-new">New PIN (৪-৬ সংখ্যা)</label>
              <input id="pin-new" name="pin" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="off" required className="input-field tracking-[0.4em]" />
            </div>
            <div>
              <label className="label-text" htmlFor="pin-confirm">Confirm PIN</label>
              <input id="pin-confirm" name="confirmPin" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="off" required className="input-field tracking-[0.4em]" />
            </div>
            <SubmitButton className="btn-primary w-full">Save PIN</SubmitButton>
          </form>
        </Section>
      </div>
    </AppShell>
  );
}
