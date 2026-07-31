"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * The catch-net.
 *
 * Most people who reach the bottom of this page are interested but not
 * ready to spend money today. Without this they leave and are gone. An
 * email address costs them nothing and is the only asset here that
 * compounds — it's yours, not a platform's.
 */
export function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      const data = await res.json();

      if (res.ok) {
        setState("done");
        setMessage(data.message ?? "You're on the list.");
      } else {
        setState("error");
        setMessage(data.error ?? "That didn't work. Try again?");
      }
    } catch {
      setState("error");
      setMessage("Network trouble. Try again in a moment.");
    }
  }

  return (
    <section className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="reveal card mx-auto max-w-4xl overflow-hidden rounded-[28px] px-7 py-14 text-center sm:px-14 sm:py-20">
        <span className="eyebrow">Not ready yet</span>
        <h2 className="display mx-auto mt-4 max-w-[18ch] text-[clamp(1.85rem,4.5vw,3.25rem)]">
          Then just stay close.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-bone-dim">
          New film, the occasional long thought, and first access when slots
          open. No schedule, no selling, unsubscribe in one click.
        </p>

        <div className="mx-auto mt-9 max-w-md">
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2.5 rounded-full border border-ember/40 bg-ember/10 px-6 py-4 text-sm text-ember"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3 8.5l3.2 3.2L13 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {message}
              </motion.p>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="flex-1 rounded-full border border-line-bright bg-ink/60 px-5 py-4 text-sm text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
                >
                  {state === "sending" ? "…" : "Keep me posted"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {state === "error" && (
            <p className="mt-3 text-sm text-ember">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
