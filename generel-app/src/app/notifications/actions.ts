"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeLink } from "@/lib/notification-meta";

async function requireUserId() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

/** Marks one of the caller's own notifications as read. */
export async function markNotificationRead(id: string) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markNotificationReadForm(formData: FormData) {
  await markNotificationRead(formData.get("id") as string);
}

export async function markNotificationUnreadForm(formData: FormData) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { id: formData.get("id") as string, userId },
    data: { readAt: null },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

/** Action link: mark as read, then go to the page the notification points at. */
export async function openNotification(formData: FormData) {
  const userId = await requireUserId();
  const id = formData.get("id") as string;

  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) redirect("/notifications");

  if (!notification.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  revalidatePath("/notifications");
  redirect(safeLink(notification.link) ?? "/notifications");
}
