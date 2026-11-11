const STATUS_CLASS: Record<string, string> = {
  PENDING_CLAIM: "badge-pending",
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  DELIVERED: "badge-approved",
  REJECTED: "badge-rejected",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_CLASS[status] ?? "badge-pending"}`}>{status}</span>;
}
