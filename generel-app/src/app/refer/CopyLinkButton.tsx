"use client";

import { useState } from "react";

export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={link}
        className="input-field font-mono text-sm"
        onFocus={(e) => e.currentTarget.select()}
      />
      <button onClick={handleCopy} className="btn-primary shrink-0">
        {copied ? "Copied ✓" : "Copy Link"}
      </button>
    </div>
  );
}
