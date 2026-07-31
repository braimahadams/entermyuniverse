"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatPrice, type OfferView } from "@/lib/types";

/**
 * The booking flow.
 *
 * Three steps, one visible at a time, with everything already decided kept
 * on screen in the summary rail. The design goal is that at no point does
 * someone have to wonder how much further this goes — every abandoned
 * booking here is money that was already reaching for its wallet.
 */

type DaySlots = { date: string; slots: { startsAt: string; endsAt: string }[] };
type Step = 0 | 1 | 2;

export function BookingFlow({
  offers,
  initialOffer,
  fromVideo,
  prefilledTopic,
  paymentsEnabled,
}: {
  offers: OfferView[];
  initialOffer?: string;
  fromVideo?: string;
  prefilledTopic?: string;
  paymentsEnabled: boolean;
}) {
  const preselected = offers.find((o) => o.slug === initialOffer);

  const [offer, setOffer] = useState<OfferView | null>(
    // If there's only one thing to buy, choosing it isn't a decision —
    // it's a speed bump. Skip straight to the calendar.
    preselected ?? (offers.length === 1 ? offers[0] : null),
  );
  const [step, setStep] = useState<Step>(preselected || offers.length === 1 ? 1 : 0);

  const [timezone, setTimezone] = useState("UTC");
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(prefilledTopic ?? "");
  const [context, setContext] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Bumped to force a fresh availability fetch after a slot is lost. */
  const [reloadKey, setReloadKey] = useState(0);

  // Guess their zone from the browser. Nobody should have to pick a
  // timezone from a dropdown of four hundred.
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  // Load availability whenever the chosen session changes.
  useEffect(() => {
    if (!offer || timezone === "UTC") return;
    let cancelled = false;

    setDays(null);
    setSlot(null);

    fetch(
      `/api/availability?handle=${encodeURIComponent(offer.creatorHandle)}` +
        `&offer=${encodeURIComponent(offer.slug)}` +
        `&tz=${encodeURIComponent(timezone)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: DaySlots[] = data.days ?? [];
        setDays(list);
        setActiveDate(list[0]?.date ?? null);
      })
      .catch(() => !cancelled && setDays([]));

    return () => {
      cancelled = true;
    };
  }, [offer, timezone, reloadKey]);

  const activeDay = useMemo(
    () => days?.find((d) => d.date === activeDate) ?? null,
    [days, activeDate],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!offer || !slot || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: offer.creatorHandle,
          offer: offer.slug,
          startsAt: slot,
          name,
          email,
          topic,
          context: context || undefined,
          timezone,
          fromVideo,
          website,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        // A taken slot means our list is stale — send them back to pick
        // again against freshly fetched availability.
        if (res.status === 409) {
          setSlot(null);
          setStep(1);
          setReloadKey((k) => k + 1);
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch {
      setError("Network trouble. Nothing was charged — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
      {/* ── steps ── */}
      <div className="order-2 lg:order-1">
        <StepRail step={step} showOfferStep={offers.length > 1} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <Panel key="offer">
              <h1 className="display text-[clamp(1.9rem,4.5vw,2.75rem)]">
                Which room?
              </h1>
              <p className="mt-3 text-sm text-bone-dim">
                Both are one to one. The only difference is how far we get.
              </p>

              <div className="mt-8 space-y-4">
                {offers.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setOffer(o);
                      setStep(1);
                    }}
                    className="card group flex w-full items-center justify-between gap-6 rounded-2xl p-6 text-left transition-all duration-300 hover:border-line-bright hover:bg-bone/[0.04]"
                  >
                    <span>
                      <span className="display block text-2xl">{o.name}</span>
                      <span className="mt-1.5 block text-sm text-bone-dim">
                        {o.tagline}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="display block text-2xl">
                        {formatPrice(o.priceCents, o.currency)}
                      </span>
                      <span className="text-xs text-bone-faint">
                        {o.durationMin} min
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {step === 1 && offer && (
            <Panel key="when">
              <h1 className="display text-[clamp(1.9rem,4.5vw,2.75rem)]">
                When suits you?
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-bone-dim">
                Times shown in
                <span className="rounded-full border border-line bg-bone/5 px-2.5 py-0.5 text-xs text-bone">
                  {timezone.replace(/_/g, " ")}
                </span>
                — your local time.
              </p>

              {days === null ? (
                <SlotSkeleton />
              ) : days.length === 0 ? (
                <EmptyCalendar />
              ) : (
                <>
                  <div className="-mx-1 mt-8 flex gap-2.5 overflow-x-auto px-1 pb-3">
                    {days.map((day) => (
                      <DatePill
                        key={day.date}
                        date={day.date}
                        count={day.slots.length}
                        active={day.date === activeDate}
                        onClick={() => {
                          setActiveDate(day.date);
                          setSlot(null);
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {activeDay?.slots.map((s) => {
                      const selected = slot === s.startsAt;
                      return (
                        <button
                          key={s.startsAt}
                          onClick={() => setSlot(s.startsAt)}
                          className={`rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                            selected
                              ? "border-ember bg-ember text-ink"
                              : "border-line bg-bone/[0.02] text-bone hover:border-line-bright hover:bg-bone/[0.06]"
                          }`}
                        >
                          {new Date(s.startsAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: timezone,
                          })}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-9 flex gap-3">
                    {offers.length > 1 && (
                      <button
                        onClick={() => setStep(0)}
                        className="rounded-full border border-line px-6 py-3.5 text-sm text-bone-dim transition-colors hover:border-line-bright hover:text-bone"
                      >
                        Back
                      </button>
                    )}
                    <button
                      onClick={() => setStep(2)}
                      disabled={!slot}
                      className="flex-1 rounded-full bg-bone px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-300 enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {slot ? "Continue" : "Pick a time"}
                    </button>
                  </div>
                </>
              )}
            </Panel>
          )}

          {step === 2 && offer && (
            <Panel key="you">
              <h1 className="display text-[clamp(1.9rem,4.5vw,2.75rem)]">
                What are we taking apart?
              </h1>
              <p className="mt-3 text-sm text-bone-dim">
                The more specific this is, the less of the call we spend
                warming up.
              </p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className={inputClass}
                      placeholder="Ada"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className={inputClass}
                      placeholder="you@email.com"
                    />
                  </Field>
                </div>

                <Field
                  label="The one thing"
                  hint={
                    prefilledTopic
                      ? "Carried over from the film — edit it freely."
                      : undefined
                  }
                >
                  <textarea
                    required
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="The question you keep circling."
                  />
                </Field>

                <Field label="Anything I should know first" optional>
                  <textarea
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Context, background, what you've already tried."
                  />
                </Field>

                {/* Honeypot: hidden from people, irresistible to bots.
                    Clipped rather than moved off-canvas, so it can't
                    extend the scrollable area. */}
                <div
                  aria-hidden
                  className="absolute h-px w-px overflow-hidden"
                  style={{ clipPath: "inset(50%)" }}
                >
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-line px-6 py-4 text-sm text-bone-dim transition-colors hover:border-line-bright hover:text-bone"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-full bg-gradient-to-r from-gold to-ember px-6 py-4 text-sm font-semibold text-ink transition-transform duration-300 enabled:hover:scale-[1.01] disabled:opacity-50"
                  >
                    {submitting
                      ? "One moment…"
                      : offer.priceCents > 0 && paymentsEnabled
                        ? `Pay ${formatPrice(offer.priceCents, offer.currency)} and confirm`
                        : "Confirm booking"}
                  </button>
                </div>

                <p className="text-center text-xs text-bone-faint">
                  {offer.priceCents > 0 && paymentsEnabled
                    ? "Secure payment via Stripe. Free to reschedule up to 12 hours before."
                    : "Free to reschedule up to 12 hours before."}
                </p>
              </form>
            </Panel>
          )}
        </AnimatePresence>
      </div>

      {/* ── summary rail ── */}
      <aside className="order-1 lg:order-2">
        <div className="card sticky top-8 rounded-2xl p-6">
          <span className="eyebrow">Your booking</span>

          <dl className="mt-5 space-y-4 text-sm">
            <SummaryRow
              label="Session"
              value={offer?.name}
              sub={offer ? `${offer.durationMin} minutes` : undefined}
            />
            <SummaryRow
              label="When"
              value={
                slot
                  ? new Date(slot).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      timeZone: timezone,
                    })
                  : undefined
              }
              sub={
                slot
                  ? `${new Date(slot).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: timezone,
                    })} · ${timezone.replace(/_/g, " ")}`
                  : undefined
              }
            />
          </dl>

          {offer && (
            <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
              <span className="text-sm text-bone-dim">Total</span>
              <span className="display text-2xl">
                {offer.priceCents > 0 && paymentsEnabled
                  ? formatPrice(offer.priceCents, offer.currency)
                  : "Free"}
              </span>
            </div>
          )}

          <p className="mt-5 text-xs leading-relaxed text-bone-faint">
            One to one, on video. Nothing recorded unless you ask.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ── pieces ────────────────────────────────────────────────── */

const inputClass =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-sm text-bone placeholder:text-bone-faint transition-colors focus:border-ember focus:outline-none";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StepRail({
  step,
  showOfferStep,
}: {
  step: Step;
  showOfferStep: boolean;
}) {
  const labels = showOfferStep
    ? ["Session", "Time", "Details"]
    : ["Time", "Details"];
  const current = showOfferStep ? step : step - 1;

  return (
    <div className="mb-9 flex items-center gap-3">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className={`text-xs transition-colors duration-300 ${
              i === current
                ? "text-ember"
                : i < current
                  ? "text-bone-dim"
                  : "text-bone-faint"
            }`}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
            <span
              className={`h-px w-8 transition-colors duration-300 ${
                i < current ? "bg-bone-dim" : "bg-line"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function DatePill({
  date,
  count,
  active,
  onClick,
}: {
  date: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  // Parse as a plain calendar date — `new Date("2026-08-03")` is UTC
  // midnight, which lands on the previous day for anyone west of London.
  const [y, m, d] = date.split("-").map(Number);
  const local = new Date(y, m - 1, d);

  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-4 py-3 transition-all duration-200 ${
        active
          ? "border-bone bg-bone text-ink"
          : "border-line bg-bone/[0.02] text-bone hover:border-line-bright"
      }`}
    >
      <span className="text-[10px] uppercase tracking-wider opacity-60">
        {local.toLocaleDateString("en-US", { weekday: "short" })}
      </span>
      <span className="text-lg font-medium leading-none">{d}</span>
      <span className="text-[10px] opacity-60">{count} free</span>
    </button>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-2 text-xs font-medium uppercase tracking-[0.14em] text-bone-faint">
        {label}
        {optional && <span className="normal-case tracking-normal">optional</span>}
      </span>
      {children}
      {hint && <span className="mt-2 block text-xs text-ember/80">{hint}</span>}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string;
  value?: string;
  sub?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </dt>
      <dd className="mt-1">
        {value ? (
          <>
            <span className="block text-bone">{value}</span>
            {sub && <span className="block text-xs text-bone-dim">{sub}</span>}
          </>
        ) : (
          <span className="block text-bone-faint">—</span>
        )}
      </dd>
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="mt-8">
      <div className="flex gap-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-[70px] w-[74px] rounded-xl" />
        ))}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-[50px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyCalendar() {
  return (
    <div className="card mt-8 rounded-2xl p-8 text-center">
      <p className="text-sm text-bone">Nothing open right now.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-bone-dim">
        Either the calendar is full or hours haven&rsquo;t been set yet. Leave
        your email on the home page and you&rsquo;ll hear first when slots open.
      </p>
    </div>
  );
}
