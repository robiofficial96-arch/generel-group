"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { RP_NAME, RP_ID, ORIGIN, regChallenges } from "@/lib/webauthn";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";

export async function getRegistrationOptions() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const existing = await prisma.passkey.findMany({
    where: { userId: session.user.id },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: session.user.id,
    userName: session.user.mobile,
    userDisplayName: session.user.name ?? session.user.mobile,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    excludeCredentials: existing.map((p) => ({
      id: Buffer.from(p.credentialId, "base64url"),
      type: "public-key" as const,
    })),
  });

  regChallenges.set(session.user.id, {
    challenge: options.challenge,
    createdAt: Date.now(),
  });

  return options;
}

export async function verifyRegistration(responseJson: string, deviceLabel: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const stored = regChallenges.get(session.user.id);
  if (!stored) throw new Error("Registration session expired, আবার চেষ্টা করো");

  const response = JSON.parse(responseJson) as RegistrationResponseJSON;

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Fingerprint registration verify করা যায়নি");
  }

  const { credentialPublicKey, counter } = verification.registrationInfo;

  await prisma.passkey.create({
    data: {
      userId: session.user.id,
      credentialId: response.id,
      publicKey: Buffer.from(credentialPublicKey),
      counter: BigInt(counter),
      deviceLabel: deviceLabel || "Device",
    },
  });

  await notify(prisma, {
    userId: session.user.id,
    category: "ACCOUNT",
    title: "Fingerprint login চালু হয়েছে",
    body: `"${deviceLabel || "Device"}" device-এ fingerprint/passkey login যোগ করা হয়েছে। তুমি নিজে না করে থাকলে এখনই admin-কে জানাও।`,
    link: "/settings/passkey",
  });

  regChallenges.delete(session.user.id);
  revalidatePath("/settings/passkey");
}

export async function deletePasskey(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const id = formData.get("id") as string;
  const removed = await prisma.passkey.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (removed.count > 0) {
    await notify(prisma, {
      userId: session.user.id,
      category: "ACCOUNT",
      title: "Fingerprint login সরানো হয়েছে",
      body: "একটি device-এর fingerprint/passkey login মুছে ফেলা হয়েছে।",
      link: "/settings/passkey",
    });
  }

  revalidatePath("/settings/passkey");
}
