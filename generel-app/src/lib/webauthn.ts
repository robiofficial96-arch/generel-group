export const RP_NAME = "Generel App";
export const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
export const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";

// Dev-only in-memory stores. In production these belong in Redis or a DB
// table (challenges expire in minutes and must survive across instances).
type Challenge = { challenge: string; createdAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __webauthnRegChallenges: Map<string, Challenge> | undefined;
  // eslint-disable-next-line no-var
  var __webauthnAuthChallenges: Map<string, Challenge> | undefined;
  // eslint-disable-next-line no-var
  var __webauthnVerifiedLogins: Map<string, { userId: string; expiresAt: number }> | undefined;
}

export const regChallenges =
  globalThis.__webauthnRegChallenges ?? (globalThis.__webauthnRegChallenges = new Map());
export const authChallenges =
  globalThis.__webauthnAuthChallenges ?? (globalThis.__webauthnAuthChallenges = new Map());
export const verifiedLogins =
  globalThis.__webauthnVerifiedLogins ?? (globalThis.__webauthnVerifiedLogins = new Map());
