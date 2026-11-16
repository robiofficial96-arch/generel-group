"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Icon from "./Icon";
import type { TreeNode } from "@/lib/team";
import { initials, tk } from "@/lib/format";

/**
 * Interactive binary genealogy tree: zoom in/out, fit-to-screen, collapse a
 * branch, select a node for its details panel, and re-root on any member.
 * Read-only — placement can never be changed from here.
 */
export default function TreeView({
  root,
  basePath,
  parentHref,
}: {
  root: TreeNode;
  basePath: string;
  parentHref: string | null;
}) {
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TreeNode>(root);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fit = () => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const natural = canvas.scrollWidth;
    setZoom(Math.max(0.35, Math.min(1, (viewport.clientWidth - 16) / natural)));
    viewport.scrollTo({ left: 0, top: 0 });
  };

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node: TreeNode | null, side: "LEFT" | "RIGHT" | null, isRoot = false) => {
    if (!node) {
      return (
        <div className="tree-node-wrap">
          {side && <span className="tree-side">{side}</span>}
          <div className="tree-card tree-card-empty">খালি position</div>
        </div>
      );
    }
    const hasChildren = Boolean(node.left || node.right);
    const isCollapsed = collapsed.has(node.id);
    return (
      <div className="tree-node-wrap">
        {side && <span className="tree-side">{side}</span>}
        <button
          type="button"
          onClick={() => setSelected(node)}
          aria-pressed={selected.id === node.id}
          className={`tree-card ${isRoot ? "tree-card-root" : ""} ${selected.id === node.id ? "!border-[var(--royal)]" : ""}`}
        >
          <span className="avatar">{initials(node.name)}</span>
          <span className="w-full truncate text-[13px] font-semibold">{node.name}</span>
          <span className="font-mono text-[11px] text-[var(--muted)]">{node.mobile}</span>
          <span className={`badge ${node.status === "ACTIVE" ? "badge-approved" : "badge-neutral"}`}>
            {node.status === "ACTIVE" ? "Active" : "Normal"}
          </span>
          <span className="text-[11px] font-semibold tabular-nums">{tk(node.invested)}</span>
        </button>

        {hasChildren && (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            aria-label={isCollapsed ? "Expand branch" : "Collapse branch"}
            aria-expanded={!isCollapsed}
            className="z-[1] -mb-1 mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--muted)] hover:text-[var(--royal)]"
          >
            <Icon name={isCollapsed ? "plus" : "minus"} size={13} />
          </button>
        )}
        {node.hasMore && (
          <Link href={`${basePath}?root=${node.id}`} className="btn-ghost mt-1 !min-h-7 !text-[11px]">
            আরো দেখো <Icon name="chevron-down" size={12} />
          </Link>
        )}

        {hasChildren && !isCollapsed && (
          <div className="tree-children">
            <div className="tree-branch tree-branch-left">{renderNode(node.left, "LEFT")}</div>
            <div className="tree-branch tree-branch-right">{renderNode(node.right, "RIGHT")}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px]">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] px-4 py-3">
          <div className="flex items-center gap-2">
            {parentHref && (
              <Link href={parentHref} className="btn-outline !min-h-9 !px-3 text-sm">
                <Icon name="chevron-left" size={15} /> Upline
              </Link>
            )}
            <span className="text-sm text-[var(--muted)]">3 level দেখানো হচ্ছে</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.15).toFixed(2)))} aria-label="Zoom out" className="icon-btn !h-9 !w-9">
              <Icon name="minus" size={16} />
            </button>
            <span className="w-12 text-center text-xs font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))} aria-label="Zoom in" className="icon-btn !h-9 !w-9">
              <Icon name="plus" size={16} />
            </button>
            <button type="button" onClick={fit} className="btn-outline !min-h-9 !px-3 text-sm">
              <Icon name="maximize" size={15} /> Fit
            </button>
          </div>
        </div>
        <div ref={viewportRef} className="tree-viewport">
          <div ref={canvasRef} className="tree-canvas" style={{ zoom }}>
            <div className="flex justify-center">{renderNode(root, null, true)}</div>
          </div>
        </div>
      </div>

      <aside className="card p-5" aria-label="Member details">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Node details</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="avatar avatar-lg">{initials(selected.name)}</span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{selected.name}</p>
            <p className="font-mono text-sm text-[var(--muted)]">{selected.mobile}</p>
          </div>
        </div>
        <dl className="kv mt-4">
          <div className="kv-row"><dt>Status</dt><dd>{selected.status === "ACTIVE" ? "Active" : "Normal"}</dd></div>
          <div className="kv-row"><dt>Investment volume</dt><dd className="tabular-nums">{tk(selected.invested)}</dd></div>
          <div className="kv-row"><dt>Left</dt><dd>{selected.left?.name ?? (selected.hasMore ? "…" : "খালি")}</dd></div>
          <div className="kv-row"><dt>Right</dt><dd>{selected.right?.name ?? (selected.hasMore ? "…" : "খালি")}</dd></div>
        </dl>
        {selected.id !== root.id && (
          <Link href={`${basePath}?root=${selected.id}`} className="btn-primary mt-4 w-full">
            এই member-এর tree দেখো
          </Link>
        )}
      </aside>
    </div>
  );
}
