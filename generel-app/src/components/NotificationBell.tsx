"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/notifications/actions";
import { CATEGORY_META, safeLink, timeAgo, type Category } from "@/lib/notification-meta";

type Item = {
  id: string;
  category: Category;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Feed = { unread: number; items: Item[] };

const POLL_MS = 20_000;
const TOAST_MS = 6_000;

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();

  const [feed, setFeed] = useState<Feed | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Item[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  // Ids already shown to this tab; null until the first successful load so
  // existing notifications don't all pop up as toasts on page load.
  const seenIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Feed;

      if (seenIds.current === null) {
        seenIds.current = new Set(data.items.map((i) => i.id));
      } else {
        const seen = seenIds.current;
        const fresh = data.items.filter((i) => !i.read && !seen.has(i.id));
        data.items.forEach((i) => seen.add(i.id));
        if (fresh.length > 0) {
          setToasts((current) => [...fresh, ...current].slice(0, 3));
          fresh.forEach((item) => {
            setTimeout(() => {
              setToasts((current) => current.filter((t) => t.id !== item.id));
            }, TOAST_MS);
          });
        }
      }

      setFeed(data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Initial load, polling, and refresh when the tab regains focus.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    // Most notifications are caused by the user's own form submit (deposit,
    // withdraw, invest...) — check shortly after one instead of waiting a poll.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onSubmit = () => {
      for (const delay of [1200, 3500]) {
        const t = setTimeout(() => {
          timers.delete(t);
          load();
        }, delay);
        timers.add(t);
      }
    };
    document.addEventListener("submit", onSubmit);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      timers.forEach(clearTimeout);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("submit", onSubmit);
    };
  }, [load]);

  // Refresh right after navigation (most notifications follow a form submit).
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [pathname, load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(item: Item) {
    setOpen(false);
    setToasts((current) => current.filter((t) => t.id !== item.id));
    if (!item.read) {
      setFeed((current) =>
        current
          ? {
              unread: Math.max(0, current.unread - 1),
              items: current.items.map((i) => (i.id === item.id ? { ...i, read: true } : i)),
            }
          : current
      );
      try {
        await markNotificationRead(item.id);
      } catch {
        load();
      }
    }
    router.push(safeLink(item.link) ?? "/notifications");
  }

  async function markAll() {
    setFeed((current) =>
      current ? { unread: 0, items: current.items.map((i) => ({ ...i, read: true })) } : current
    );
    try {
      await markAllNotificationsRead();
    } finally {
      load();
    }
  }

  const unread = feed?.unread ?? 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="icon-btn relative"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="notif-count" data-testid="notif-count">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="card fixed inset-x-3 top-16 z-30 overflow-hidden shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
            <p className="font-semibold">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                  {unread} unread
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto sm:max-h-96">
            {feed === null && !failed && (
              <div className="space-y-3 p-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--border-color)]/50" />
                ))}
              </div>
            )}

            {feed === null && failed && (
              <div className="p-6 text-center text-sm">
                <p className="text-[var(--muted)]">Notification load করা যায়নি।</p>
                <button type="button" onClick={load} className="btn-ghost mt-3">
                  আবার চেষ্টা করো
                </button>
              </div>
            )}

            {feed !== null && feed.items.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--muted)]">
                এখনো কোনো notification নেই।
              </p>
            )}

            {feed?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className={`notif-row ${item.read ? "" : "notif-row-unread"}`}
              >
                <span className={`notif-icon ${CATEGORY_META[item.category].className}`} aria-hidden="true">
                  {CATEGORY_META[item.category].icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={`text-sm ${item.read ? "font-medium" : "font-semibold"}`}>
                      {item.title}
                    </span>
                    {!item.read && <span className="notif-dot" aria-label="Unread" />}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--muted)]">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-[var(--muted)]">
                    {CATEGORY_META[item.category].label} · {timeAgo(item.createdAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--border-color)] px-4 py-3 text-center text-sm font-medium text-[var(--brand)] hover:underline"
          >
            সব notification দেখো
          </Link>
        </div>
      )}

      {/* Portaled to <body>: the sticky header's backdrop-filter would otherwise
          become the containing block for this position:fixed stack. */}
      {toasts.length > 0 && createPortal(
        <div className="notif-toasts" role="status" aria-live="polite">
          {toasts.map((item) => (
            <div key={item.id} className="card notif-toast">
              <button
                type="button"
                onClick={() => openItem(item)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span className={`notif-icon ${CATEGORY_META[item.category].className}`} aria-hidden="true">
                  {CATEGORY_META[item.category].icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--muted)]">
                    {item.body}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setToasts((current) => current.filter((t) => t.id !== item.id))}
                className="shrink-0 px-1 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
