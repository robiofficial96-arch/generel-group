"use client";

import { useState, useTransition } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import Icon from "@/components/Icon";
import { createTransfer, lookupRecipient } from "./actions";
import { tk } from "@/lib/format";

export default function TransferForm({ balance, feeRate }: { balance: number; feeRate: number }) {
  const [mobile, setMobile] = useState("");
  const [amountText, setAmountText] = useState("");
  const [recipient, setRecipient] = useState<{ for: string; name?: string; error?: string } | null>(null);
  const [checking, startChecking] = useTransition();

  const amount = Number(amountText) || 0;
  const fee = Math.round(amount * feeRate * 100) / 100;
  const received = amount - fee;
  const verified = recipient?.for === mobile.trim() && Boolean(recipient.name);

  const verify = () => {
    const value = mobile.trim();
    if (!value) return;
    startChecking(async () => {
      const result = await lookupRecipient(value);
      setRecipient("name" in result ? { for: value, name: result.name } : { for: value, error: result.error });
    });
  };

  return (
    <form action={createTransfer} className="space-y-5">
      <div>
        <label className="label-text" htmlFor="tr-to">Recipient User ID (mobile)</label>
        <div className="flex gap-2">
          <input
            id="tr-to"
            name="toMobile"
            required
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onBlur={verify}
            placeholder="01XXXXXXXXX"
            className="input-field font-mono"
          />
          <button type="button" onClick={verify} disabled={checking || !mobile.trim()} className="btn-outline shrink-0">
            {checking ? "Checking…" : "Verify"}
          </button>
        </div>
        <div aria-live="polite">
          {recipient?.for === mobile.trim() && recipient.name && (
            <p className="mt-2 flex items-center gap-2 rounded-xl bg-[#eefaf4] px-3 py-2 text-sm font-medium text-[#0f6b46]">
              <Icon name="check" size={16} /> Recipient: {recipient.name}
            </p>
          )}
          {recipient?.for === mobile.trim() && recipient.error && (
            <p className="field-hint !text-[var(--danger)]">{recipient.error}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label-text" htmlFor="tr-amount">Amount (৳)</label>
        <input
          id="tr-amount"
          name="amount"
          type="number"
          min="1"
          max={balance || undefined}
          step="1"
          inputMode="numeric"
          required
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          className="input-field tabular-nums"
        />
        <p className="field-hint">Sender wallet: T-Wallet · Available {tk(balance)}</p>
        {amount > balance && <p className="field-hint !text-[var(--danger)]">T-Wallet balance-এর বেশি</p>}
      </div>

      <dl className="kv rounded-2xl bg-[var(--background)] px-4 py-1.5" aria-live="polite">
        <div className="kv-row">
          <dt>Transfer amount</dt>
          <dd className="tabular-nums">{tk(amount)}</dd>
        </div>
        <div className="kv-row">
          <dt>Transaction fee ({Math.round(feeRate * 100)}%)</dt>
          <dd className="tabular-nums text-[var(--danger)]">− {tk(fee)}</dd>
        </div>
        <div className="kv-row">
          <dt className="!font-semibold !text-[var(--foreground)]">Recipient gets</dt>
          <dd className="font-display text-lg tabular-nums text-[var(--success)]">{tk(received)}</dd>
        </div>
      </dl>

      <div>
        <label className="label-text" htmlFor="tr-pin">Transaction PIN</label>
        <input
          id="tr-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          className="input-field"
        />
      </div>

      {verified ? (
        <ConfirmButton
          className="btn-primary w-full"
          title="Transfer confirm করো"
          message={
            <>
              <strong>{recipient?.name}</strong> ({mobile.trim()})-কে {tk(amount)} পাঠাচ্ছো। Fee {tk(fee)} কেটে প্রাপক
              পাবে <strong>{tk(received)}</strong>। এই transfer ফেরত নেওয়া যাবে না।
            </>
          }
          confirmLabel="Send transfer"
        >
          Send Transfer
        </ConfirmButton>
      ) : (
        <button type="button" onClick={verify} className="btn-primary w-full" disabled={checking || !mobile.trim()}>
          আগে Recipient verify করো
        </button>
      )}
    </form>
  );
}
