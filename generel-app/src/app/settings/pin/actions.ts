"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function setTransactionPin(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const pin = formData.get("pin") as string;
  const confirmPin = formData.get("confirmPin") as string;

  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN অবশ্যই ৪-৬ সংখ্যার হতে হবে");
  }
  if (pin !== confirmPin) {
    throw new Error("PIN দুটি মিলছে না");
  }

  const transactionPinHash = await bcrypt.hash(pin, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { transactionPinHash },
  });

  revalidatePath("/settings/pin");
}
