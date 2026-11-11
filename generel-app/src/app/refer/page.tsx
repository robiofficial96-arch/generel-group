import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import AppShell from "@/components/AppShell";
import CopyLinkButton from "./CopyLinkButton";

export const instant = false;

export default async function ReferPage() {
  const session = await auth();
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { leftChild: true, rightChild: true },
      })
    : null;

  const referralLink = user ? `${protocol}://${host}/join?ref=${user.mobile}` : "";

  const directCount = [user?.leftChild, user?.rightChild].filter(Boolean).length;

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Refer & Earn</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        নিচের লিংক শেয়ার করে নতুন মানুষ যোগ করো — তোমার Left/Right টিম তৈরি হবে।
      </p>

      <div className="card mt-5 max-w-xl p-5">
        <p className="label-text">আমার Referral Link</p>
        <CopyLinkButton link={referralLink} />

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="label-text">Left Side</p>
            <p className="font-medium">{user?.leftChild ? user.leftChild.name : "খালি"}</p>
          </div>
          <div>
            <p className="label-text">Right Side</p>
            <p className="font-medium">{user?.rightChild ? user.rightChild.name : "খালি"}</p>
          </div>
          <div>
            <p className="label-text">মোট Direct</p>
            <p className="font-medium">{directCount} / 2</p>
          </div>
        </div>
      </div>

      <div className="card mt-6 max-w-xl p-5">
        <h2 className="font-semibold">কমিশন কাঠামো</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="badge badge-approved shrink-0">6%</span>
            <span>
              <span className="font-medium">Direct Referral Commission</span> — তুমি যাকে সরাসরি
              রেফার করবে, সে ইনভেস্ট করলেই অ্যামাউন্টের ৬% সাথে সাথে তোমার C-Wallet এ জমা হবে।
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge badge-approved shrink-0">5%</span>
            <span>
              <span className="font-medium">Team Matching Commission</span> — তোমার Left ও Right
              টিমের মোট ইনভেস্টমেন্ট ভলিউম হুবহু সমান (Exact Match) হলে, মিলে যাওয়া অ্যামাউন্টের ৫%
              C-Wallet এ জমা হবে। অমিল থাকা অংশ পরের ইনভেস্টমেন্টের জন্য জমা (Carry Forward) থাকবে।
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge shrink-0" style={{ background: "#e0e7ff", color: "#3730a3" }}>
              Rank
            </span>
            <span>
              <span className="font-medium">Rank & Rewards</span> — Left ও Right দুই পাশেই পর্যাপ্ত
              ভলিউম/টিম হলে Rank আনলক হয়, সাথে cash reward, মাসিক salary ও physical reward।
            </span>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}
