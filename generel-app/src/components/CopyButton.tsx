"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={value}
        aria-label="Referral link"
        className="input-field font-mono text-[13px]"
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" onClick={copy} className="btn-primary shrink-0">
        <Icon name={copied ? "check" : "copy"} size={16} />
        {copied ? "Copied" : label}
      </button>
    </div>
  );
}
