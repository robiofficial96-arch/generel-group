import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";
import { tkCompact } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--brand)]">
            <Icon name="chevron-left" size={14} /> {back.label}
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div role={error ? "alert" : "status"} className={`alert ${error ? "alert-error" : "alert-success"}`}>
      <Icon name={error ? "info" : "check"} size={18} />
      <span>{error ?? ok}</span>
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={`alert ${tone === "warning" ? "alert-warning" : "alert-info"}`}>
      <Icon name="info" size={18} />
      <span>{children}</span>
    </div>
  );
}

const TONES = {
  blue: "tone-blue",
  green: "tone-green",
  amber: "tone-amber",
  red: "tone-red",
  violet: "tone-violet",
  teal: "tone-teal",
  slate: "tone-slate",
} as const;

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  hint,
  href,
  featured,
}: {
  label: string;
  value: ReactNode;
  icon: string;
  tone?: keyof typeof TONES;
  hint?: ReactNode;
  href?: string;
  featured?: boolean;
}) {
  const body = (
    <>
      <span className={`stat-icon ${featured ? "stat-icon-featured" : TONES[tone]}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {hint && <span className="stat-hint">{hint}</span>}
      </span>
    </>
  );
  const className = `stat-card ${featured ? "stat-card-featured" : ""} ${href ? "stat-card-link" : ""}`;
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
  flush,
  className = "",
}: {
  title?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** Remove body padding (tables / lists that run edge to edge). */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="section-head">
          <div className="min-w-0">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-5 pt-0"}>{children}</div>
    </section>
  );
}

export function SeeAll({ href, label = "See all" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="btn-ghost shrink-0">
      {label} <Icon name="chevron-right" size={14} />
    </Link>
  );
}

export function EmptyState({
  icon = "file",
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={24} />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Amount({ value, signed }: { value: number; signed?: boolean }) {
  const abs = `৳${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (!signed) return <span className="tabular-nums font-semibold">{abs}</span>;
  return (
    <span className={`tabular-nums font-semibold ${value >= 0 ? "text-[var(--success)]" : "text-[var(--foreground)]"}`}>
      {value >= 0 ? "+" : "−"}
      {abs}
    </span>
  );
}

export function Tabs({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <nav className="tabs" aria-label="Filter">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`tab ${tab.key === active ? "tab-active" : ""}`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && <span className="tab-count">{tab.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function KeyValue({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} className="kv-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Vertical bar chart (server-rendered, no JS). */
export function BarChart({
  data,
  height = 170,
  highlightLast = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  highlightLast?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);
  return (
    <div>
      <div className="bar-chart" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${tkCompact(d.value)}`).join(", ")}>
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 2);
          const peak = highlightLast ? i === data.length - 1 : d.value === max && hasData;
          return (
            <div key={`${d.label}-${i}`} className="bar-col" title={`${d.label}: ${tkCompact(d.value)}`}>
              <span className="bar-value">{d.value > 0 ? tkCompact(d.value) : ""}</span>
              <span className={`bar ${peak && d.value > 0 ? "bar-peak" : ""}`} style={{ height: `${pct}%` }} />
              <span className="bar-label">{d.label}</span>
            </div>
          );
        })}
      </div>
      {!hasData && <p className="mt-2 text-center text-xs text-[var(--muted)]">এই সময়ে কোনো data নেই</p>}
    </div>
  );
}

const DONUT_COLORS = ["#2457D6", "#101B35", "#E9A23B", "#16A36A", "#8B5CF6", "#0EA5B7"];

/** Donut chart with legend. */
export function Donut({ data, centerLabel }: { data: { label: string; value: number }[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const slices = data.map((d, i) => {
    const before = data.slice(0, i).reduce((s, x) => s + Math.max(x.value, 0), 0);
    const fraction = total > 0 ? Math.max(d.value, 0) / total : 0;
    return {
      ...d,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      fraction,
      dash: fraction * circumference,
      offset: total > 0 ? (before / total) * circumference : 0,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Distribution">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="13" />
          {slices
            .filter((s) => s.fraction > 0)
            .map((s) => (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="13"
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] text-[var(--muted)]">{centerLabel ?? "Total"}</span>
          <span className="text-sm font-bold tabular-nums">{tkCompact(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold tabular-nums">
              {tkCompact(s.value)}
              <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">{Math.round(s.fraction * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Progress({ value, max, tone = "blue" }: { value: number; max: number; tone?: "blue" | "green" | "amber" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className={`progress-bar progress-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = parts.length ? (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase() : "?";
  return <span className={`avatar avatar-${size}`}>{text}</span>;
}
