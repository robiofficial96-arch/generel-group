"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
        isActive
          ? "bg-[var(--brand)] text-white"
          : "text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--border-color)_40%,transparent)]"
      }`}
    >
      {children}
    </Link>
  );
}
