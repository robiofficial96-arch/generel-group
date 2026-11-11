"use server";

import { prisma } from "@/lib/prisma";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { RP_ID, ORIGIN, authChallenges, verifiedLogins } from "@/lib/webauthn";

export async function getAuthenticationOptions(mobile: string) {
  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { passkeys: true },
  });

  if (!user || user.passkeys.length === 0) {
    throw new Error("এই মোবাইলে কোনো fingerprint registered নেই");
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
    allowCredentials: user.passkeys.map((p) => ({
      id: Buffer.from(p.credentialId, "base64url"),
      type: "public-key" as const,
    })),
  });

  authChallenges.set(mobile, { challenge: options.challenge, createdAt: Date.now() });

  return options;
}

export async function verifyPasskeyLogin(mobile: string, responseJson: string) {
  const stored = authChallenges.get(mobile);
  if (!stored) throw new Error("Session expired, আবার চেষ্টা করো");

  const response = JSON.parse(responseJson) as AuthenticationResponseJSON;

  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { passkeys: true },
  });
  if (!user) throw new Error("User পাওয়া যায়নি");

  const passkey = user.passkeys.find((p) => p.credentialId === response.id);
  if (!passkey) throw new Error("এই fingerprint চেনা যাচ্ছে না");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: Buffer.from(passkey.credentialId, "base64url"),
      credentialPublicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
    },
  });

  if (!verification.verified) {
    throw new Error("Fingerprint verify করা যায়নি");
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter) },
  });

  authChallenges.delete(mobile);
  verifiedLogins.set(mobile, { userId: user.id, expiresAt: Date.now() + 60_000 });

  return { success: true };
}
