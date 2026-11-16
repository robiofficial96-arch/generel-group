import type { ReactNode } from "react";
import Icon from "./Icon";

/** Split-screen auth layout on desktop, app-like single column on mobile. */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <div className="flex items-center gap-3">
          <span className="brand-mark">G</span>
          <span className="text-lg font-bold">Generel Group</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            Premium investment &amp; team management.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            পাঁচটি wallet, 18 মাসের ROI plan, binary team ও commission — সব এক জায়গায়, নিরাপদ ও স্বচ্ছ।
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {["Transaction PIN ও Fingerprint দিয়ে সুরক্ষিত", "সব charge আগে থেকেই দেখানো হয়", "Admin-verified deposit ও withdrawal"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Icon name="check" size={14} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© Generel Group</p>
      </aside>

      <main className="auth-panel">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="brand-mark">G</span>
            <span className="text-lg font-bold">Generel Group</span>
          </div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
