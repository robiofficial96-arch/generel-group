import { prisma } from "@/lib/prisma";
import { joinViaReferral } from "./actions";

export const instant = false;

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  const upline = ref ? await prisma.user.findUnique({ where: { mobile: ref } }) : null;

  if (!ref || !upline) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold">Invalid Referral Link</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            এই লিংকটি সঠিক না। সঠিক referral link দিয়ে আবার চেষ্টা করো।
          </p>
        </div>
      </div>
    );
  }

  const leftOpen = upline.leftChildId === null;
  const rightOpen = upline.rightChildId === null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form action={joinViaReferral} className="card w-full max-w-sm space-y-4 p-8">
        <div className="mb-2 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white">
            G
          </span>
          <h1 className="text-xl font-semibold">Generel App এ Join করো</h1>
          <p className="text-sm text-[var(--muted)]">
            Referrer: {upline.name} ({upline.mobile})
          </p>
        </div>

        <input type="hidden" name="refMobile" value={upline.mobile} />

        <div>
          <label className="label-text">Name</label>
          <input name="name" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Mobile Number</label>
          <input name="mobile" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Password</label>
          <input name="password" type="password" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Placement Side</label>
          <select name="side" required className="input-field">
            {leftOpen && <option value="LEFT">Left</option>}
            {rightOpen && <option value="RIGHT">Right</option>}
          </select>
          {!leftOpen && !rightOpen && (
            <p className="mt-1 text-xs text-red-600">
              দুই পাশই পূর্ণ — এই referrer-এর মাধ্যমে আর join করা যাবে না।
            </p>
          )}
        </div>

        <button className="btn-primary w-full" disabled={!leftOpen && !rightOpen}>
          Create Account
        </button>
      </form>
    </div>
  );
}
