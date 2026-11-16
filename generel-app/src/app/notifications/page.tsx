import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import {
  CATEGORY_META,
  NOTIFICATION_TABS,
  safeLink,
  timeAgo,
  type Category,
} from "@/lib/notification-meta";
import {
  markAllNotificationsRead,
  markNotificationReadForm,
  markNotificationUnreadForm,
  openNotification,
} from "./actions";

export const instant = false;

const PAGE_SIZE = 20;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;

  const activeTab =
    NOTIFICATION_TABS.find((t) => t.key === first(params.tab)) ?? NOTIFICATION_TABS[0];
  const unreadOnly = first(params.unread) === "1";
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

  const userId = session?.user?.id ?? "";

  const where = {
    userId,
    ...(activeTab.categories ? { category: { in: activeTab.categories } } : {}),
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [items, total, unreadByCategory] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.groupBy({
      by: ["category"],
      where: { userId, readAt: null },
      _count: { _all: true },
    }),
  ]);

  const unreadCount = (categories: Category[] | null) =>
    unreadByCategory
      .filter((row) => categories === null || categories.includes(row.category))
      .reduce((sum, row) => sum + row._count._all, 0);

  const totalUnread = unreadCount(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (overrides: { tab?: string; unread?: boolean; page?: number }) => {
    const tab = overrides.tab ?? activeTab.key;
    const unread = overrides.unread ?? unreadOnly;
    const targetPage = overrides.page ?? 1;
    const query = new URLSearchParams();
    if (tab !== "all") query.set("tab", tab);
    if (unread) query.set("unread", "1");
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `/notifications?${qs}` : "/notifications";
  };

  const now = new Date();

  return (
    <AppShell user={session?.user}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {totalUnread > 0
              ? `${totalUnread} টি unread notification আছে`
              : "সব notification পড়া হয়েছে"}
          </p>
        </div>
        {totalUnread > 0 && (
          <form action={markAllNotificationsRead}>
            <button className="btn-outline px-3 py-1.5 text-sm">Mark all as read</button>
          </form>
        )}
      </div>

      <nav
        aria-label="Notification categories"
        className="mt-5 flex gap-1 overflow-x-auto pb-1"
      >
        {NOTIFICATION_TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          const count = unreadCount(tab.categories);
          return (
            <Link
              key={tab.key}
              href={hrefFor({ tab: tab.key })}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-[var(--brand)] text-white"
                  : "border border-[var(--border-color)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                    isActive ? "bg-white/25 text-white" : "bg-[#dc4c55] text-white"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex gap-2 text-sm">
        <Link
          href={hrefFor({ unread: false })}
          className={unreadOnly ? "text-[var(--muted)]" : "font-semibold text-[var(--brand)]"}
        >
          সব
        </Link>
        <span className="text-[var(--border-color)]">|</span>
        <Link
          href={hrefFor({ unread: true })}
          className={unreadOnly ? "font-semibold text-[var(--brand)]" : "text-[var(--muted)]"}
        >
          শুধু Unread
        </Link>
      </div>

      <div className="card mt-4 overflow-hidden">
        {items.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-medium">কোনো notification নেই</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {unreadOnly
                ? "এই category-তে কোনো unread notification নেই।"
                : "Deposit, withdrawal, investment, commission বা account-এর কোনো update হলে এখানে দেখাবে।"}
            </p>
          </div>
        )}

        <ul>
          {items.map((n) => {
            const meta = CATEGORY_META[n.category];
            const isUnread = n.readAt === null;
            const link = safeLink(n.link);
            return (
              <li
                key={n.id}
                className={`notif-row ${isUnread ? "notif-row-unread" : ""}`}
                data-unread={isUnread}
              >
                <span className={`notif-icon ${meta.className}`} aria-hidden="true">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    {isUnread && <span className="notif-dot" aria-label="Unread" />}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-[var(--muted)]">
                      {meta.label} ·{" "}
                      <time dateTime={n.createdAt.toISOString()} title={n.createdAt.toLocaleString("en-GB")}>
                        {timeAgo(n.createdAt, now)}
                      </time>
                    </span>
                    {link && (
                      <form action={openNotification}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="font-medium text-[var(--brand)] hover:underline">
                          বিস্তারিত দেখো →
                        </button>
                      </form>
                    )}
                    <form action={isUnread ? markNotificationReadForm : markNotificationUnreadForm}>
                      <input type="hidden" name="id" value={n.id} />
                      <button className="font-medium text-[var(--muted)] hover:underline">
                        {isUnread ? "Mark as read" : "Mark as unread"}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={hrefFor({ page: page - 1 })} className="btn-outline px-3 py-1.5 text-sm">
              ← আগের
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[var(--muted)] tabular-nums">
            Page {Math.min(page, totalPages)} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={hrefFor({ page: page + 1 })} className="btn-outline px-3 py-1.5 text-sm">
              পরের →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </AppShell>
  );
}
