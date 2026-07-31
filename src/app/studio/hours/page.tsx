import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  addBlackout,
  addHours,
  deleteBlackout,
  deleteHours,
} from "@/app/studio/actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export default async function StudioHoursPage() {
  const user = await requireUser();
  // Hours only mean anything if you can be booked.
  if (!user.canSell) redirect("/studio");

  const [rules, blackouts] = await Promise.all([
    db.availabilityRule.findMany({
      where: { userId: user.id },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
    }),
    db.blackoutDate.findMany({
      where: { userId: user.id, endsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="display text-3xl">Hours</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          Recurring weekly windows, in your timezone. Visitors always see them
          converted to theirs — you never do the maths.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="display mb-4 text-xl">Weekly</h2>

          <div className="card mb-4 space-y-2 rounded-2xl p-5">
            {rules.length === 0 ? (
              <p className="py-3 text-center text-sm text-bone-dim">
                No hours set — nothing is bookable.
              </p>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
                >
                  <span className="text-sm">
                    <span className="text-bone">{WEEKDAYS[rule.weekday]}</span>
                    <span className="ml-2.5 text-bone-dim">
                      {clock(rule.startMin)} – {clock(rule.endMin)}
                    </span>
                    <span className="ml-2 text-xs text-bone-faint">
                      {rule.timezone}
                    </span>
                  </span>
                  <form action={deleteHours}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button className="text-xs text-bone-faint transition-colors hover:text-ember">
                      Remove
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          <form action={addHours} className="card space-y-4 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Day">
                <select name="weekday" defaultValue="1" className={input}>
                  {WEEKDAYS.map((day, i) => (
                    <option key={day} value={i} className="bg-ink-2">
                      {day}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="From">
                <input name="start" type="time" defaultValue="14:00" className={input} />
              </Field>
              <Field label="To">
                <input name="end" type="time" defaultValue="18:00" className={input} />
              </Field>
            </div>

            <Field label="Timezone">
              <input name="timezone" defaultValue={user.timezone} className={input} />
            </Field>

            <button className="w-full rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]">
              Add window
            </button>
          </form>
        </section>

        <section>
          <h2 className="display mb-4 text-xl">Time off</h2>

          <div className="card mb-4 space-y-2 rounded-2xl p-5">
            {blackouts.length === 0 ? (
              <p className="py-3 text-center text-sm text-bone-dim">
                Nothing blocked off.
              </p>
            ) : (
              blackouts.map((blackout) => (
                <div
                  key={blackout.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
                >
                  <span className="text-sm">
                    <span className="text-bone">
                      {blackout.startsAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {blackout.endsAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {blackout.reason && (
                      <span className="ml-2.5 text-bone-dim">{blackout.reason}</span>
                    )}
                  </span>
                  <form action={deleteBlackout}>
                    <input type="hidden" name="id" value={blackout.id} />
                    <button className="text-xs text-bone-faint transition-colors hover:text-ember">
                      Remove
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          <form action={addBlackout} className="card space-y-4 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input name="startsAt" type="date" required className={input} />
              </Field>
              <Field label="To">
                <input name="endsAt" type="date" required className={input} />
              </Field>
            </div>
            <Field label="Reason">
              <input name="reason" placeholder="Travelling" className={input} />
            </Field>
            <button className="w-full rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]">
              Block these days
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink/60 px-3 py-2.5 text-sm text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
