"use client";

import { useState } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import { requestWithdrawal } from "./actions";
import { tk } from "@/lib/format";

export default function WithdrawForm({
  cBalance,
  rBalance,
  feeRate,
  min,
}: {
  cBalance: number;
  rBalance: number;
  feeRate: number;
  min: number;
}) {
  const [source, setSource] = useState<"C_WALLET" | "R_WALLET">("C_WALLET");
  const [amountText, setAmountText] = useState("");

  const amount = Number(amountText) || 0;
  const fee = Math.round(amount * feeRate * 100) / 100;
  const net = amount - fee;
  const balance = source === "C_WALLET" ? cBalance : rBalance;
  const tooLow = amount > 0 && amount < min;
  const tooHigh = amount > balance;

  return (
    <form action={requestWithdrawal} className="space-y-5">
      <fieldset>
        <legend className="label-text">Withdraw from</legend>
        <div className="option-grid">
          {(
            [
              ["C_WALLET", "C-Wallet", "Commission", cBalance],
              ["R_WALLET", "R-Wallet", "ROI", rBalance],
            ] as const
          ).map(([value, label, hint, bal]) => (
            <label key={value} className="option-card">
              <input
                type="radio"
                name="sourceWallet"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
              />
              {label}
              <small>
                {hint} · {tk(bal)}
              </small>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label-text" htmlFor="wd-amount">Amount (৳)</label>
        <input
          id="wd-amount"
          name="amount"
          type="number"
          min={min}
          max={balance || undefined}
          step="1"
          inputMode="numeric"
          required
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          placeholder={`সর্বনিম্ন ${min.toLocaleString("en-US")}`}
          aria-invalid={tooLow || tooHigh}
          className="input-field tabular-nums"
        />
        {tooLow && <p className="field-hint !text-[var(--danger)]">সর্বনিম্ন withdrawal {tk(min)}</p>}
        {tooHigh && <p className="field-hint !text-[var(--danger)]">Available balance {tk(balance)}-এর বেশি</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-text" htmlFor="wd-channel">Withdrawal channel</label>
          <select id="wd-channel" name="channel" className="input-field" defaultValue="ADMIN">
            <option value="ADMIN">Admin Withdrawal</option>
            <option value="AGENT">Agent Withdrawal</option>
            <option value="ID_TO_ID">ID-to-ID</option>
          </select>
        </div>
        <div>
          <label className="label-text" htmlFor="wd-method">Payout method</label>
          <select id="wd-method" name="payoutMethod" className="input-field" defaultValue="MFS">
            <option value="BANK">Bank Payout</option>
            <option value="MFS">MFS Payout (bKash / Nagad / Rocket)</option>
            <option value="DIGITAL">Digital Payout</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label-text" htmlFor="wd-account">Destination account details</label>
        <input
          id="wd-account"
          name="accountDetails"
          required
          minLength={5}
          maxLength={200}
          placeholder="যেমন bKash 017XXXXXXXX বা Bank, A/C name, A/C no."
          className="input-field"
        />
      </div>

      {/* Charges are always shown before submitting */}
      <dl className="kv rounded-2xl bg-[var(--background)] px-4 py-1.5" aria-live="polite">
        <div className="kv-row">
          <dt>Requested amount</dt>
          <dd className="tabular-nums">{tk(amount)}</dd>
        </div>
        <div className="kv-row">
          <dt>Transaction charge ({Math.round(feeRate * 100)}%)</dt>
          <dd className="tabular-nums text-[var(--danger)]">− {tk(fee)}</dd>
        </div>
        <div className="kv-row">
          <dt className="!font-semibold !text-[var(--foreground)]">Net payable</dt>
          <dd className="font-display text-lg tabular-nums text-[var(--success)]">{tk(net)}</dd>
        </div>
      </dl>

      <ConfirmButton
        className="btn-primary w-full"
        title="Withdrawal confirm করো"
        message={
          <>
            {tk(amount)} request করছো। Charge <strong>{tk(fee)}</strong> কেটে তুমি পাবে{" "}
            <strong>{tk(net)}</strong>। Amount এখনই wallet থেকে hold হবে।
          </>
        }
        confirmLabel="Submit request"
        summary={[
          { name: "payoutMethod", label: "Payout method" },
          { name: "accountDetails", label: "Account" },
        ]}
      >
        Submit Withdrawal Request
      </ConfirmButton>
    </form>
  );
}
