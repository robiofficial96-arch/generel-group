import Icon from "./Icon";
import StatusBadge from "./StatusBadge";
import { Amount, EmptyState } from "./ui";
import { fmtDateTime } from "@/lib/format";
import { WALLET_INFO, type ActivityRow } from "@/lib/activity";

const TYPE_STYLE: Record<string, { icon: string; tone: string }> = {
  Deposit: { icon: "deposit", tone: "tone-green" },
  Withdrawal: { icon: "withdraw", tone: "tone-amber" },
  Investment: { icon: "invest", tone: "tone-blue" },
  "Direct Commission": { icon: "percent", tone: "tone-violet" },
  "Matching Commission": { icon: "scale", tone: "tone-violet" },
  "ROI Credit": { icon: "repeat", tone: "tone-teal" },
  "Transfer Sent": { icon: "transfer", tone: "tone-slate" },
  "Transfer Received": { icon: "transfer", tone: "tone-green" },
};

/** Compact transaction feed (dashboard, wallet details). */
export function TxList({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="activity"
        title="কোনো transaction নেই"
        text="Deposit, investment, commission বা transfer হলে এখানে দেখাবে।"
      />
    );
  }
  return (
    <ul>
      {rows.map((row) => {
        const style = TYPE_STYLE[row.type] ?? { icon: "activity", tone: "tone-slate" };
        return (
          <li key={row.id} className="tx-row">
            <span className={`tx-icon ${style.tone}`}>
              <Icon name={style.icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{row.type}</p>
              <p className="truncate text-xs text-[var(--muted)]">
                {WALLET_INFO[row.wallet].name} · {fmtDateTime(row.date)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm">
                <Amount value={row.amount} signed />
              </p>
              {row.status !== "APPROVED" && (
                <div className="mt-0.5">
                  <StatusBadge status={row.status} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Full transaction table: desktop table, structured cards on mobile. */
export function TxTable({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="activity"
        title="কোনো transaction পাওয়া যায়নি"
        text="এই filter-এ কোনো record নেই।"
      />
    );
  }
  return (
    <div className="table-wrap">
      <table className="table-base table-cards">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Wallet</th>
            <th className="!text-right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const style = TYPE_STYLE[row.type] ?? { icon: "activity", tone: "tone-slate" };
            return (
              <tr key={row.id}>
                <td className="cell-main">
                  <span className="flex items-center gap-3">
                    <span className={`tx-icon ${style.tone}`}>
                      <Icon name={style.icon} size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{row.type}</span>
                      <span className="cell-muted block truncate">{row.detail}</span>
                    </span>
                  </span>
                </td>
                <td data-label="Reference" className="font-mono text-[13px]">{row.ref}</td>
                <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(row.date)}</td>
                <td data-label="Wallet">{WALLET_INFO[row.wallet].name}</td>
                <td data-label="Amount" className="md:text-right">
                  <Amount value={row.amount} signed />
                </td>
                <td data-label="Status">
                  <StatusBadge status={row.status} label={row.status === "APPROVED" ? "Completed" : undefined} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
