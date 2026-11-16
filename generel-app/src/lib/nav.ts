// Navigation hierarchy for the two separate experiences (customer / admin).
// Rank, Rewards and Leadership modules are intentionally out of scope.

export type NavItem = { href: string; label: string; icon: string; badge?: "approvals" | "tickets" };
export type NavGroup = { label: string; items: NavItem[] };

export const CUSTOMER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  {
    label: "Wallet",
    items: [
      { href: "/wallets", label: "My Wallets", icon: "wallet" },
      { href: "/deposit", label: "Deposit", icon: "deposit" },
      { href: "/withdraw", label: "Withdraw", icon: "withdraw" },
      { href: "/transfer", label: "ID-to-ID Transfer", icon: "transfer" },
      { href: "/activity", label: "Activity", icon: "activity" },
    ],
  },
  {
    label: "Investment",
    items: [
      { href: "/invest", label: "Investment Slots", icon: "invest" },
      { href: "/commissions", label: "Commissions", icon: "percent" },
    ],
  },
  {
    label: "Team",
    items: [
      { href: "/team", label: "My Team", icon: "users" },
      { href: "/team/tree", label: "Genealogy Tree", icon: "tree" },
      { href: "/matching", label: "Binary Matching", icon: "scale" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "My Profile", icon: "user" },
      { href: "/settings/pin", label: "Transaction PIN", icon: "key" },
      { href: "/settings/passkey", label: "Fingerprint Login", icon: "fingerprint" },
      { href: "/support", label: "Support Center", icon: "support" },
    ],
  },
];

export const CUSTOMER_BOTTOM: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/wallets", label: "Wallet", icon: "wallet" },
  { href: "/team", label: "Team", icon: "users" },
  { href: "/activity", label: "Activity", icon: "activity" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "grid" },
      { href: "/admin/approvals", label: "Approvals", icon: "check", badge: "approvals" },
      { href: "/admin/reports", label: "Reports & Analytics", icon: "report" },
    ],
  },
  {
    label: "User Management",
    items: [
      { href: "/admin/users", label: "Users", icon: "users" },
      { href: "/admin/genealogy", label: "Genealogy", icon: "tree" },
      { href: "/admin/roles", label: "Roles & Permissions", icon: "shield" },
    ],
  },
  {
    label: "Financial Management",
    items: [
      { href: "/admin/deposits", label: "Deposits", icon: "deposit" },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: "withdraw" },
      { href: "/admin/wallets", label: "Wallets", icon: "wallet" },
    ],
  },
  {
    label: "Investment Management",
    items: [
      { href: "/admin/investments", label: "Investments", icon: "invest" },
      { href: "/admin/roi", label: "ROI Management", icon: "repeat" },
    ],
  },
  {
    label: "Commission & Matching",
    items: [
      { href: "/admin/commissions", label: "Commissions", icon: "percent" },
      { href: "/admin/matching", label: "Binary Matching", icon: "scale" },
    ],
  },
  {
    label: "Support",
    items: [{ href: "/admin/support", label: "Support Tickets", icon: "support", badge: "tickets" }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "System Settings", icon: "settings" },
      { href: "/admin/audit", label: "Audit Logs", icon: "file" },
    ],
  },
];

export const ADMIN_BOTTOM: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/approvals", label: "Approvals", icon: "check", badge: "approvals" },
  { href: "/admin/reports", label: "Reports", icon: "report" },
];

/** The nav href that best matches the current path (longest prefix wins). */
export function activeHref(pathname: string, groups: NavGroup[]): string | null {
  let best: string | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && (best === null || item.href.length > best.length)) best = item.href;
    }
  }
  return best;
}

export function findLabel(pathname: string, groups: NavGroup[]): { group: string; label: string } | null {
  const href = activeHref(pathname, groups);
  if (!href) return null;
  for (const group of groups) {
    const item = group.items.find((i) => i.href === href);
    if (item) return { group: group.label, label: item.label };
  }
  return null;
}
