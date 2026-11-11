"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { getAuthenticationOptions, verifyPasskeyLogin } from "./passkey-actions";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      mobile,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Mobile বা Password ভুল");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handlePasskeyLogin = async () => {
    setError("");
    if (!mobile) {
      setError("আগে Mobile Number লেখো");
      return;
    }
    setPasskeyBusy(true);
    try {
      const options = await getAuthenticationOptions(mobile);
      const response = await startAuthentication(options);
      await verifyPasskeyLogin(mobile, JSON.stringify(response));

      const res = await signIn("passkey", { mobile, redirect: false });
      if (res?.error) {
        setError("Fingerprint login ব্যর্থ হয়েছে");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fingerprint login ব্যর্থ হয়েছে");
    } finally {
      setPasskeyBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="mb-2 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white">
            G
          </span>
          <h1 className="text-xl font-semibold">Generel App</h1>
        </div>

        <div>
          <label className="label-text">Mobile Number</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-text">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full">
          Login
        </button>

        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={passkeyBusy}
          className="btn-outline w-full"
        >
          {passkeyBusy ? "যাচাই হচ্ছে..." : "🔒 Fingerprint দিয়ে Login"}
        </button>
      </form>
    </div>
  );
}
