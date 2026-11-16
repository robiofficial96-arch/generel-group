"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { getAuthenticationOptions, verifyPasskeyLogin } from "./passkey-actions";
import AuthLayout from "@/components/AuthLayout";
import Icon from "@/components/Icon";

function LoginForm() {
  const router = useRouter();
  const joined = useSearchParams().get("joined") === "1";
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await signIn("credentials", { mobile, password, redirect: false });
      if (res?.error) {
        setError("Mobile বা Password ভুল");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Login করা যায়নি, আবার চেষ্টা করো");
    } finally {
      setBusy(false);
    }
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
    <AuthLayout title="Welcome back" subtitle="তোমার account-এ login করো।">
      {joined && (
        <div className="alert alert-success" role="status">
          <Icon name="check" size={18} />
          <span>Account তৈরি হয়েছে — এখন login করো।</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        <div>
          <label className="label-text" htmlFor="login-mobile">Mobile number / User ID</label>
          <input id="login-mobile" type="text" inputMode="numeric" autoComplete="username" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="input-field" />
        </div>

        <div>
          <label className="label-text" htmlFor="login-password">Password</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--background)]"
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error !mb-0" role="alert">
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Logging in…" : "Login"}
        </button>

        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border-color)]" /> অথবা <span className="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <button type="button" onClick={handlePasskeyLogin} disabled={passkeyBusy} className="btn-outline w-full">
          <Icon name="fingerprint" size={18} />
          {passkeyBusy ? "যাচাই হচ্ছে…" : "Fingerprint দিয়ে Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        নতুন account শুধু referral link দিয়ে খোলা যায়। Password ভুলে গেলে support/admin-এর সাথে যোগাযোগ করো।
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
