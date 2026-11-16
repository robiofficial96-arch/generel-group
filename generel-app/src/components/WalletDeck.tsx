"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Icon from "./Icon";

export type DeckWallet = {
  key: "E" | "G" | "C" | "R" | "T";
  name: string;
  tag: string;
  balance: number;
  href: string;
};

function formatBalance(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function AtmCard({
  wallet,
  holder,
  masked,
  hidden,
  asLink = true,
}: {
  wallet: DeckWallet;
  holder: string;
  masked: string;
  hidden: boolean;
  asLink?: boolean;
}) {
  const content = (
    <>
      <span className="atm-pattern" aria-hidden="true" />
      <span className="atm-top">
        <span className="atm-chip" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="text-right leading-tight">
          <span className="block text-[15px] font-bold tracking-wide">{wallet.name}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
            {wallet.tag}
          </span>
        </span>
      </span>

      <span className="atm-balance">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] opacity-65">
          Available balance
        </span>
        <span className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-lg font-semibold opacity-80">৳</span>
          <span className="atm-amount">{hidden ? "•••••••" : formatBalance(wallet.balance)}</span>
        </span>
      </span>

      <span className="atm-bottom">
        <span className="leading-tight">
          <span className="block font-mono text-[13px] tracking-[0.14em]">{masked}</span>
          <span className="mt-0.5 block max-w-40 truncate text-[11px] font-medium uppercase tracking-wider opacity-70">
            {holder}
          </span>
        </span>
        <span className="atm-network" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="sr-only">BDT</span>
      </span>
    </>
  );

  return asLink ? (
    <Link href={wallet.href} className={`atm atm-${wallet.key}`} aria-label={`${wallet.name} details`}>
      {content}
    </Link>
  ) : (
    <div className={`atm atm-${wallet.key}`}>{content}</div>
  );
}

/**
 * ATM-style wallet collection: a horizontal card row on desktop and a
 * swipeable, snap-scrolling single-card carousel with pagination on mobile.
 */
export default function WalletDeck({
  wallets,
  holder,
  masked,
}: {
  wallets: DeckWallet[];
  holder: string;
  masked: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetWidth + 16;
    setIndex(Math.min(wallets.length - 1, Math.max(0, Math.round(track.scrollLeft / step))));
  };

  const goTo = (i: number) => {
    const track = trackRef.current;
    const child = track?.children[i] as HTMLElement | undefined;
    if (track && child) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">My Wallets</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-pressed={hidden}
            className="btn-ghost"
          >
            <Icon name={hidden ? "eye" : "eye-off"} size={15} />
            {hidden ? "Show balance" : "Hide balance"}
          </button>
          <Link href="/wallets" className="btn-ghost">
            All wallets <Icon name="chevron-right" size={14} />
          </Link>
        </div>
      </div>

      <div ref={trackRef} onScroll={onScroll} className="atm-track">
        {wallets.map((w) => (
          <AtmCard key={w.key} wallet={w} holder={holder} masked={masked} hidden={hidden} />
        ))}
      </div>

      <div className="atm-dots" role="tablist" aria-label="Wallet cards">
        {wallets.map((w, i) => (
          <button
            key={w.key}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={w.name}
            onClick={() => goTo(i)}
            className={`atm-dot ${i === index ? "atm-dot-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
