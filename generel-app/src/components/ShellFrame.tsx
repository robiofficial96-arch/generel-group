"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Icon from "./Icon";
import NotificationBell from "./NotificationBell";
import { logout } from "@/app/actions/session";
import {
  ADMIN_BOTTOM,
  ADMIN_NAV,
  CUSTOMER_BOTTOM,
  CUSTOMER_NAV,
  activeHref,
  findLabel,
  type NavItem,
} from "@/lib/nav";
import { initials } from "@/lib/format";

export type ShellUser = {
  name: string;
  mobile: string;
  role: string;
  status: string;
};

type Badges = { approvals: number; tickets: number };

const COLLAPSE_KEY = "generel.sidebar.collapsed";

function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("generel:sidebar", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("generel:sidebar", callback);
  };
}

function useCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    () => window.localStorage.getItem(COLLAPSE_KEY) === "1",
    () => false
  );
  const toggle = () => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event("generel:sidebar"));
  };
  return [collapsed, toggle];
}

export default function ShellFrame({
  user,
  badges,
  children,
}: {
  user: ShellUser;
  badges: Badges;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";
  const adminMode = isAdmin && pathname.startsWith("/admin");

  const groups = adminMode ? ADMIN_NAV : CUSTOMER_NAV;
  const bottom = adminMode ? ADMIN_BOTTOM : CUSTOMER_BOTTOM;
  const current = activeHref(pathname, groups);
  const crumb = findLabel(pathname, groups);

  const [collapsed, toggleCollapsed] = useCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close overlays on navigation and on Escape; lock scroll under the drawer.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
    setProfileOpen(false);
  }
  useEffect(() => {
    if (!drawerOpen && !profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, profileOpen]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const badgeFor = (item: NavItem) => (item.badge ? badges[item.badge] : 0);

  const navList = (compact: boolean) => (
    <nav aria-label={adminMode ? "Admin navigation" : "Main navigation"} className="side-nav">
      {groups.map((group) => (
        <div key={group.label} className="side-group">
          {!compact && <p className="side-group-label">{group.label}</p>}
          {compact && <div className="side-divider" />}
          {group.items.map((item) => {
            const active = item.href === current;
            const count = badgeFor(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={compact ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`side-link ${active ? "side-link-active" : ""} ${compact ? "side-link-compact" : ""}`}
              >
                <Icon name={item.icon} size={19} />
                {!compact && <span className="truncate">{item.label}</span>}
                {count > 0 && (
                  <span className={compact ? "side-badge side-badge-dot" : "side-badge"}>
                    {compact ? "" : count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const modeSwitch = isAdmin && (
    <Link href={adminMode ? "/dashboard" : "/admin"} className="side-switch">
      <Icon name="swap" size={16} />
      <span>{adminMode ? "Customer view" : "Admin console"}</span>
    </Link>
  );

  const brand = (compact: boolean) => (
    <Link href={adminMode ? "/admin" : "/dashboard"} className="flex items-center gap-3 overflow-hidden">
      <span className="brand-mark">G</span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-white">Generel Group</span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            {adminMode ? "Admin Console" : "Investment"}
          </span>
        </span>
      )}
    </Link>
  );

  return (
    <div className={`shell ${collapsed ? "shell-collapsed" : ""}`} data-mode={adminMode ? "admin" : "customer"}>
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="sidebar" aria-label="Sidebar">
        <div className="sidebar-head">
          {brand(collapsed)}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="sidebar-toggle"
          >
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={16} />
          </button>
        </div>

        <div className="sidebar-scroll">{navList(collapsed)}</div>

        <div className="sidebar-foot">
          {!collapsed && modeSwitch}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="avatar avatar-on-dark">{initials(user.name)}</span>
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
                <span className="block truncate text-xs text-white/50">ID {user.mobile}</span>
              </span>
            )}
          </div>
          <form action={logout}>
            <button className="side-logout" title="Logout">
              <Icon name="logout" size={17} />
              {!collapsed && <span>Logout</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="shell-main">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <span className="brand-mark brand-mark-sm lg:hidden">G</span>
            <div className="min-w-0">
              <p className="hidden text-xs font-medium text-[var(--muted)] lg:block">
                {adminMode ? "Admin Console" : "Customer Portal"}
                {crumb && <span> / {crumb.group}</span>}
              </p>
              <p className="truncate text-[15px] font-semibold lg:text-base">
                {crumb?.label ?? (adminMode ? "Admin" : "Generel Group")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
                aria-label="Profile menu"
                className="profile-chip"
              >
                <span className="avatar">{initials(user.name)}</span>
                <span className="hidden min-w-0 text-left leading-tight md:block">
                  <span className="block max-w-36 truncate text-sm font-semibold">{user.name}</span>
                  <span className="block text-[11px] text-[var(--muted)]">ID {user.mobile}</span>
                </span>
                <Icon name="chevron-down" size={15} className="hidden text-[var(--muted)] md:block" />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="card absolute right-0 top-12 z-40 w-64 overflow-hidden p-0 shadow-xl">
                    <div className="border-b border-[var(--border-color)] p-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">ID {user.mobile}</p>
                      <div className="mt-2 flex gap-1.5">
                        <span className={`badge ${user.status === "ACTIVE" ? "badge-approved" : "badge-neutral"}`}>
                          {user.status === "ACTIVE" ? "Active" : "Normal"}
                        </span>
                        {isAdmin && <span className="badge badge-info">Admin</span>}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link href="/profile" className="menu-link">
                        <Icon name="user" size={17} /> My Profile
                      </Link>
                      <Link href="/notifications" className="menu-link">
                        <Icon name="bell" size={17} /> Notifications
                      </Link>
                      <Link href="/support" className="menu-link">
                        <Icon name="support" size={17} /> Support Center
                      </Link>
                      {isAdmin && (
                        <Link href={adminMode ? "/dashboard" : "/admin"} className="menu-link">
                          <Icon name="swap" size={17} /> {adminMode ? "Customer view" : "Admin console"}
                        </Link>
                      )}
                      <form action={logout}>
                        <button className="menu-link w-full text-[var(--danger)]">
                          <Icon name="logout" size={17} /> Logout
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>

      {/* ---------- Mobile bottom navigation ---------- */}
      <nav className="bottom-nav" aria-label="Primary">
        {bottom.map((item) => {
          const active = item.href === current && !drawerOpen;
          const count = badgeFor(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`bottom-link ${active ? "bottom-link-active" : ""}`}
            >
              <span className="relative">
                <Icon name={item.icon} size={21} />
                {count > 0 && <span className="bottom-badge">{count > 9 ? "9+" : count}</span>}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          className={`bottom-link ${drawerOpen || !bottom.some((b) => b.href === current) ? "bottom-link-active" : ""}`}
        >
          <Icon name="menu" size={21} />
          <span>More</span>
        </button>
      </nav>

      {/* ---------- Mobile drawer (all categories) ---------- */}
      {drawerOpen && (
        <div className="drawer-root" role="dialog" aria-modal="true" aria-label="All menu">
          <button
            type="button"
            aria-label="Close menu"
            className="drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="drawer">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              {brand(false)}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="sidebar-toggle"
              >
                <Icon name="x" size={17} />
              </button>
            </div>
            <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <span className="avatar avatar-on-dark">{initials(user.name)}</span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
                <span className="block text-xs text-white/50">ID {user.mobile}</span>
              </span>
              <span className={`badge ml-auto ${user.status === "ACTIVE" ? "badge-approved" : "badge-neutral"}`}>
                {user.status === "ACTIVE" ? "Active" : "Normal"}
              </span>
            </div>
            <div className="sidebar-scroll">{navList(false)}</div>
            <div className="sidebar-foot">
              {modeSwitch}
              <form action={logout}>
                <button className="side-logout">
                  <Icon name="logout" size={17} />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
