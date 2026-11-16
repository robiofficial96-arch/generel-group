const STATUS: Record<string, { className: string; label: string }> = {
  PENDING: { className: "badge-pending", label: "Pending" },
  PENDING_CLAIM: { className: "badge-pending", label: "Pending" },
  APPROVED: { className: "badge-approved", label: "Approved" },
  DELIVERED: { className: "badge-approved", label: "Delivered" },
  REJECTED: { className: "badge-rejected", label: "Rejected" },
  ACTIVE: { className: "badge-approved", label: "Active" },
  NORMAL: { className: "badge-neutral", label: "Normal" },
  BLOCKED: { className: "badge-rejected", label: "Deactivated" },
  OPEN: { className: "badge-pending", label: "Open" },
  ANSWERED: { className: "badge-info", label: "Answered" },
  CLOSED: { className: "badge-neutral", label: "Closed" },
  PAID: { className: "badge-approved", label: "Paid" },
  COMPLETED: { className: "badge-info", label: "Completed" },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const meta = STATUS[status] ?? { className: "badge-neutral", label: status };
  return (
    <span className={`badge ${meta.className}`}>
      <span className="badge-dot" />
      {label ?? meta.label}
    </span>
  );
}
