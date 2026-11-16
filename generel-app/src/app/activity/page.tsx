import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { TxTable } from "@/components/TxList";
import { PageHeader, Section, Tabs } from "@/components/ui";
import { getActivity, type WalletKey } from "@/lib/activity";

export const instant = false;

const FILTERS: { key: string; label: string; wallet?: WalletKey }[] = [
  { key: "all", label: "All" },
  { key: "g", label: "G-Wallet", wallet: "G" },
  { key: "c", label: "C-Wallet", wallet: "C" },
  { key: "r", label: "R-Wallet", wallet: "R" },
  { key: "t", label: "T-Wallet", wallet: "T" },
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ wallet?: string; q?: string }>;
}) {
  const sessionUser = await requireUser();
  const { wallet, q } = await searchParams;
  const filter = FILTERS.find((f) => f.key === wallet) ?? FILTERS[0];
  const query = (q ?? "").trim().toLowerCase();

  const all = await getActivity(sessionUser.id, { wallet: filter.wallet, limit: 300 });
  const rows = query
    ? all.filter((r) => `${r.type} ${r.ref} ${r.detail}`.toLowerCase().includes(query))
    : all;

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Activity" subtitle="সব wallet-এর transaction history এক জায়গায়।" />

      <div className="stack">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            active={filter.key}
            tabs={FILTERS.map((f) => ({
              key: f.key,
              label: f.label,
              href: f.key === "all" ? "/activity" : `/activity?wallet=${f.key}`,
            }))}
          />
          <form className="flex gap-2 md:w-80" role="search">
            {filter.key !== "all" && <input type="hidden" name="wallet" value={filter.key} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Type বা reference দিয়ে খোঁজো"
              aria-label="Search transactions"
              className="input-field !min-h-10"
            />
            <button className="btn-outline !min-h-10 !px-3.5">Search</button>
          </form>
        </div>

        <Section flush title="Transactions" subtitle={`${rows.length} টি record`}>
          <TxTable rows={rows} />
        </Section>
      </div>
    </AppShell>
  );
}
