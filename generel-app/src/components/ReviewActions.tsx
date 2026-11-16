"use client";

import { useState } from "react";
import ConfirmButton from "./ConfirmButton";

/** Approve / reject controls for a pending request; reject requires a reason. */
export default function ReviewActions({
  idField,
  id,
  approve,
  reject,
  back,
  approveMessage,
}: {
  idField: string;
  id: string;
  approve: (formData: FormData) => Promise<void>;
  reject: (formData: FormData) => Promise<void>;
  back: string;
  approveMessage: string;
}) {
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex flex-wrap items-start justify-end gap-2">
      <form action={approve}>
        <input type="hidden" name={idField} value={id} />
        <input type="hidden" name="back" value={back} />
        <ConfirmButton className="btn-success" tone="success" title="Approve করবে?" message={approveMessage} confirmLabel="Approve">
          Approve
        </ConfirmButton>
      </form>

      {rejecting ? (
        <form action={reject} className="flex w-full min-w-56 flex-col gap-2 sm:w-64">
          <input type="hidden" name={idField} value={id} />
          <input type="hidden" name="back" value={back} />
          <input name="reason" required minLength={3} maxLength={200} placeholder="Rejection reason" aria-label="Rejection reason" className="input-field !min-h-9 !text-sm" autoFocus />
          <div className="flex gap-2">
            <ConfirmButton className="btn-danger" tone="danger" title="Reject করবে?" message="User-কে কারণসহ notification পাঠানো হবে।" confirmLabel="Reject">
              Confirm reject
            </ConfirmButton>
            <button type="button" onClick={() => setRejecting(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setRejecting(true)} className="btn-danger">Reject</button>
      )}
    </div>
  );
}
