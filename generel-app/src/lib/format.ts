// Client + server safe formatting helpers (no Prisma import).

type Numeric = number | string | { toString(): string } | null | undefined;

export function num(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** "৳100,000" */
export function tk(value: Numeric): string {
  return `৳${num(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** Compact form for chart axes / tight cards: ৳1.2M, ৳85K */
export function tkCompact(value: Numeric): string {
  const n = num(value);
  if (Math.abs(n) >= 1_000_000) return `৳${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `৳${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `৳${n}`;
}

export function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short human reference from a cuid, e.g. ref("DEP", id) -> "DEP-9EV54K". */
export function ref(prefix: string, id: string): string {
  return `${prefix}-${id.slice(-6).toUpperCase()}`;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** 01711000001 -> "•••• 0001" */
export function maskedId(mobile: string | null | undefined): string {
  return `•••• ${(mobile ?? "").slice(-4) || "0000"}`;
}

export const METHOD_LABEL: Record<string, string> = {
  BANK: "Bank Transfer",
  MFS: "MFS (bKash / Nagad / Rocket)",
  DIGITAL: "Digital Payment",
};

export const CHANNEL_LABEL: Record<string, string> = {
  ADMIN: "Admin Withdrawal",
  AGENT: "Agent Withdrawal",
  ID_TO_ID: "ID-to-ID",
};
