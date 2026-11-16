import { redirect } from "next/navigation";

const GENERIC = "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করো।";

/**
 * Runs a server-action body and returns a user-safe error message instead of
 * throwing (a thrown error would render the framework error screen). Database
 * errors are never shown verbatim.
 */
export async function attempt(fn: () => Promise<void>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (e instanceof Error) {
      // Let Next.js control-flow signals (redirect/notFound) pass through.
      if ("digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_")) throw e;
      if (e.name.startsWith("Prisma") || e.constructor.name.startsWith("Prisma")) {
        console.error(e);
        return GENERIC;
      }
      return e.message || GENERIC;
    }
    return GENERIC;
  }
}

/** Redirects back to `path` with a one-shot ?ok= / ?error= message. */
export function flash(path: string, type: "ok" | "error", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${type}=${encodeURIComponent(message)}`);
}

export type FlashParams = Promise<Record<string, string | string[] | undefined>>;

export async function readFlash(searchParams: FlashParams) {
  const params = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { ok: pick(params.ok), error: pick(params.error), params };
}
