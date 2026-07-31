"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelBooking({ token }: { token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${token}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "That didn't work.");
      }
    } catch {
      setError("Network trouble. Try again.");
    } finally {
      setWorking(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-full border border-line px-6 py-3.5 text-sm text-bone-dim transition-colors hover:border-line-bright hover:text-bone"
      >
        Cancel this booking
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-bone-dim">
        Cancel for certain? The time goes back on the calendar straight away.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-full border border-line px-6 py-3.5 text-sm text-bone-dim transition-colors hover:text-bone"
        >
          Keep it
        </button>
        <button
          onClick={cancel}
          disabled={working}
          className="flex-1 rounded-full border border-ember/50 bg-ember/10 px-6 py-3.5 text-sm font-medium text-ember transition-colors hover:bg-ember/20 disabled:opacity-50"
        >
          {working ? "Cancelling…" : "Yes, cancel"}
        </button>
      </div>
      {error && <p className="text-center text-sm text-ember">{error}</p>}
    </div>
  );
}
