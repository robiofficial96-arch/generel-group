import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { KeyValue, Note, PageHeader, Section } from "@/components/ui";
import { tk } from "@/lib/format";
import { RULES } from "@/lib/admin";

export const instant = false;

export default async function AdminSettingsPage() {
  const admin = await requireAdminUser();
  return (
    <AppShell user={admin}>
      <PageHeader title="System Settings" subtitle="বর্তমান business rule (read-only)।" />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Section title="Commission"><KeyValue rows={[["Direct referral", `${RULES.directCommissionRate * 100}%`], ["Team matching", `${RULES.teamMatchingRate * 100}% (exact equal)`], ["Daily matching cap", "Pending configuration"]]} /></Section>
        <Section title="Investment"><KeyValue rows={[["Slots", "9 predefined"], ["Duration", `${RULES.roiMonths} months`], ["Credit frequency", "Pending configuration"], ["Funding wallet", "G-Wallet"]]} /></Section>
        <Section title="Withdrawal & Transfer"><KeyValue rows={[["Minimum", tk(RULES.minWithdraw)], ["Withdrawal charge", `${RULES.withdrawFeeRate * 100}%`], ["Transfer fee", `${RULES.transferFeeRate * 100}%`], ["Withdrawable wallets", "C-Wallet, R-Wallet"]]} /></Section>
        <Section title="Wallets"><KeyValue rows={[["G-Wallet", "Deposit credits"], ["C-Wallet", "Commissions"], ["R-Wallet", "ROI credits"], ["T-Wallet", "ID-to-ID transfers"], ["E-Wallet", "Pending definition"]]} /></Section>
      </div>
      <div className="mt-5"><Note>এই মানগুলো এখন code-এ নির্ধারিত। Edit UI ও configuration history পরবর্তী ধাপে যোগ হবে।</Note></div>
    </AppShell>
  );
}
