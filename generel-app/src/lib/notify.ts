import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { NotificationCategory } from "@/generated/prisma/client";

/** Either the global client or an interactive-transaction client. */
type Db = Prisma.TransactionClient | typeof prisma;

export type NotifyInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** In-app path the notification's action link opens. */
  link?: string;
};

/**
 * Builds the create call without awaiting it, so it can also be placed inside
 * a `prisma.$transaction([...])` array.
 */
export function notificationCreate(db: Db, input: NotifyInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

/**
 * Creates one notification. Pass the transaction client when the notification
 * must only exist if the surrounding financial operation commits.
 */
export async function notify(db: Db, input: NotifyInput) {
  await notificationCreate(db, input);
}

/** Sends the same notification to every admin (e.g. a new pending request). */
export async function notifyAdmins(
  db: Db,
  input: Omit<NotifyInput, "userId">,
  options: { excludeUserId?: string } = {}
) {
  const admins = await db.user.findMany({
    where: {
      role: "ADMIN",
      ...(options.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      category: input.category,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    })),
  });
}

/** Account notification for a freshly created user. */
export function welcomeNotification(userId: string, name: string): NotifyInput {
  return {
    userId,
    category: "ACCOUNT",
    title: "Generel App-এ স্বাগতম",
    body: `${name}, তোমার account তৈরি হয়েছে। Transfer করার আগে Settings থেকে Transaction PIN সেট করে নাও।`,
    link: "/settings/pin",
  };
}

/** Tells the upline that someone was placed directly under them. */
export function newMemberNotification(
  uplineId: string,
  memberName: string,
  memberMobile: string,
  side: "LEFT" | "RIGHT"
): NotifyInput {
  return {
    userId: uplineId,
    category: "ACCOUNT",
    title: "নতুন Team member",
    body: `${memberName} (${memberMobile}) তোমার ${side} side-এ join করেছে।`,
    link: "/refer",
  };
}

/** ৳ amount with thousands separators, e.g. "৳100,000". */
export function formatTk(amount: Prisma.Decimal | number | string): string {
  const value = Number(amount.toString());
  return `৳${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
