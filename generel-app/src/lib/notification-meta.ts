// Shared (client + server safe) notification category metadata.

export const CATEGORIES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "INVESTMENT",
  "COMMISSION",
  "TRANSFER",
  "ACCOUNT",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { label: string; icon: string; className: string }> = {
  DEPOSIT: { label: "Deposit", icon: "↓", className: "notif-deposit" },
  WITHDRAWAL: { label: "Withdrawal", icon: "↑", className: "notif-withdrawal" },
  INVESTMENT: { label: "Investment", icon: "◆", className: "notif-investment" },
  COMMISSION: { label: "Commission", icon: "%", className: "notif-commission" },
  TRANSFER: { label: "Transfer", icon: "⇄", className: "notif-transfer" },
  ACCOUNT: { label: "Account", icon: "●", className: "notif-account" },
};

/** Tabs on /notifications (UI-UX.md section 5.13). */
export const NOTIFICATION_TABS: { key: string; label: string; categories: Category[] | null }[] = [
  { key: "all", label: "All", categories: null },
  {
    key: "financial",
    label: "Financial",
    categories: ["DEPOSIT", "WITHDRAWAL", "INVESTMENT", "COMMISSION", "TRANSFER"],
  },
  { key: "deposit", label: "Deposit", categories: ["DEPOSIT"] },
  { key: "withdrawal", label: "Withdrawal", categories: ["WITHDRAWAL"] },
  { key: "investment", label: "Investment", categories: ["INVESTMENT"] },
  { key: "commission", label: "Commission", categories: ["COMMISSION"] },
  { key: "transfer", label: "Transfer", categories: ["TRANSFER"] },
  { key: "account", label: "Account", categories: ["ACCOUNT"] },
];

/** Only same-site paths are valid notification links (never an external URL). */
export function safeLink(link: string | null | undefined): string | null {
  if (!link || !link.startsWith("/") || link.startsWith("//")) return null;
  return link;
}

export function timeAgo(iso: string | Date, now: Date = new Date()): string {
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return "এইমাত্র";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} দিন আগে`;
  return then.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
