"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { getRegistrationOptions, verifyRegistration } from "./actions";
import { useRouter } from "next/navigation";

export default function PasskeyRegisterButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRegister() {
    setError("");
    setBusy(true);
    try {
      const options = await getRegistrationOptions();
      const response = await startRegistration(options);
      const deviceLabel =
        typeof navigator !== "undefined" ? navigator.platform || "Device" : "Device";
      await verifyRegistration(JSON.stringify(response), deviceLabel);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fingerprint register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={handleRegister} disabled={busy} className="btn-primary w-full">
        {busy ? "Registering..." : "+ এই Device এর Fingerprint যোগ করো"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
