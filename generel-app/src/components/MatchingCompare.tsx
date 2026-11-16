import Icon from "./Icon";
import { tk } from "@/lib/format";

/** Left-vs-right carry-forward comparison with the exact-match eligibility state. */
export default function MatchingCompare({ left, right }: { left: number; right: number }) {
  const max = Math.max(left, right, 1);
  const equal = left > 0 && left === right;
  const diff = Math.abs(left - right);
  const lower = left < right ? "Left" : "Right";

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <div className="rounded-2xl bg-[#eff5ff] p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--royal)]">Left · Team A</p>
          <p className="mt-1 font-display text-xl font-extrabold tabular-nums sm:text-2xl">{tk(left)}</p>
          <p className="text-xs text-[var(--muted)]">carry forward</p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${equal ? "tone-green" : "tone-amber"}`}
          title={equal ? "Balanced" : "Not equal"}
        >
          <Icon name="scale" size={20} />
        </span>
        <div className="rounded-2xl bg-[#eefaf4] p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">Right · Team B</p>
          <p className="mt-1 font-display text-xl font-extrabold tabular-nums sm:text-2xl">{tk(right)}</p>
          <p className="text-xs text-[var(--muted)]">carry forward</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5" aria-hidden="true">
        <div className="flex justify-end">
          <span className="h-2.5 rounded-l-full bg-[var(--royal)]" style={{ width: `${(left / max) * 100}%` }} />
        </div>
        <div>
          <span className="block h-2.5 rounded-r-full bg-[var(--success)]" style={{ width: `${(right / max) * 100}%` }} />
        </div>
      </div>

      <div className={`alert mt-4 !mb-0 ${left === 0 && right === 0 ? "alert-info" : "alert-warning"}`}>
        <Icon name="info" size={18} />
        <span>
          {left === 0 && right === 0
            ? "কোনো unmatched volume নেই। নতুন investment এলে এখানে জমা হবে।"
            : `Matching হয়নি — দুই side সমান নয়। ${lower} side-এ আরও ${tk(diff)} volume এলে ${tk(Math.max(left, right))} exact match হবে। Unmatched balance flush হয় না, carry forward থাকে।`}
        </span>
      </div>
    </div>
  );
}
