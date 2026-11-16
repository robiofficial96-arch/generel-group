import { prisma } from "@/lib/prisma";
import { joinViaReferral } from "./actions";
import AuthLayout from "@/components/AuthLayout";
import { SubmitButton } from "@/components/ConfirmButton";
import { Flash } from "@/components/ui";

export const instant = false;

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; error?: string }>;
}) {
  const { ref, error } = await searchParams;
  const upline = ref ? await prisma.user.findUnique({ where: { mobile: ref } }) : null;

  if (!ref || !upline) {
    return (
      <AuthLayout title="Invalid referral link" subtitle="এই লিংকটি সঠিক না। সঠিক referral link দিয়ে আবার চেষ্টা করো।">
        <a href="/login" className="btn-outline w-full">Login page-এ যাও</a>
      </AuthLayout>
    );
  }

  const leftOpen = upline.leftChildId === null;
  const rightOpen = upline.rightChildId === null;
  const full = !leftOpen && !rightOpen;

  return (
    <AuthLayout title="Account খোলো" subtitle={`Referrer: ${upline.name} (${upline.mobile})`}>
      <Flash error={error} />
      <form action={joinViaReferral} className="space-y-4">
        <input type="hidden" name="refMobile" value={upline.mobile} />

        <div>
          <label className="label-text" htmlFor="j-name">Full name</label>
          <input id="j-name" name="name" required minLength={2} autoComplete="name" className="input-field" />
        </div>
        <div>
          <label className="label-text" htmlFor="j-mobile">Mobile number</label>
          <input id="j-mobile" name="mobile" required inputMode="numeric" pattern="01\d{9}" placeholder="01XXXXXXXXX" autoComplete="tel" className="input-field" />
        </div>
        <div>
          <label className="label-text" htmlFor="j-pass">Password</label>
          <input id="j-pass" name="password" type="password" required minLength={8} autoComplete="new-password" className="input-field" />
          <p className="field-hint">কমপক্ষে 8 অক্ষর।</p>
        </div>

        <fieldset>
          <legend className="label-text">Placement side</legend>
          <div className="option-grid">
            {leftOpen && (
              <label className="option-card">
                <input type="radio" name="side" value="LEFT" defaultChecked required />
                Left <small>Team A</small>
              </label>
            )}
            {rightOpen && (
              <label className="option-card">
                <input type="radio" name="side" value="RIGHT" defaultChecked={!leftOpen} required />
                Right <small>Team B</small>
              </label>
            )}
          </div>
          {full && <p className="field-hint !text-[var(--danger)]">দুই পাশই পূর্ণ — এই referrer-এর মাধ্যমে আর join করা যাবে না।</p>}
        </fieldset>

        {full ? (
          <button className="btn-primary w-full" disabled>Create Account</button>
        ) : (
          <SubmitButton className="btn-primary w-full">Create Account</SubmitButton>
        )}
      </form>
    </AuthLayout>
  );
}
