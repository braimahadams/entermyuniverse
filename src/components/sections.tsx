import Link from "next/link";
import { brand } from "@/lib/brand";
import { soloMode } from "@/lib/config";

/** Section heading used everywhere, so the rhythm never drifts. */
export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <div className="reveal mb-12 max-w-2xl sm:mb-16">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display mt-4 text-[clamp(2rem,5.5vw,3.75rem)]">{title}</h2>
      {lead && (
        <p className="mt-5 text-base leading-relaxed text-bone-dim">{lead}</p>
      )}
    </div>
  );
}

/**
 * A band of ideas moving under the hero.
 *
 * Duplicated once so the -50% translate loops seamlessly. Marked
 * aria-hidden: it's texture, and a screen reader shouldn't read the same
 * six phrases twice.
 */
export function Marquee() {
  const items = [...brand.marquee, ...brand.marquee];
  return (
    <div
      // overflow-hidden is load-bearing: the track is deliberately wider
      // than the page, and without this it drags the whole document sideways.
      className="mask-edges relative overflow-hidden border-y border-line py-5"
      aria-hidden
    >
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
        {items.map((phrase, i) => (
          <span
            key={i}
            className="flex items-center gap-10 text-sm text-bone-faint"
          >
            {phrase}
            <span className="h-1 w-1 rounded-full bg-ember/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function Process() {
  return (
    <section id="how" className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="How it works"
          title={
            <>
              Three steps.
              <br />
              <span className="text-bone-faint">No funnel.</span>
            </>
          }
        />

        <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {brand.process.map((step, i) => (
            <div
              key={step.n}
              className="reveal group relative bg-ink p-8 transition-colors duration-500 hover:bg-ink-2 sm:p-10"
              style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
            >
              <span className="display text-5xl text-bone-faint transition-colors duration-500 group-hover:text-ember">
                {step.n}
              </span>
              <h3 className="mt-6 text-lg font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/**
 * FAQ built on <details>. No JavaScript, keyboard accessible for free,
 * and it works before hydration — which matters on a page someone opened
 * from Instagram on a bad connection.
 */
export function Faq() {
  return (
    <section className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHead eyebrow="Before you ask" title="The obvious questions" />

        <div className="divide-y divide-line border-y border-line">
          {brand.faq.map((item) => (
            <details key={item.q} className="reveal group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-base font-medium transition-colors group-hover:text-ember sm:text-lg">
                  {item.q}
                </span>
                <span className="relative h-4 w-4 shrink-0" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-bone-dim" />
                  <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-bone-dim transition-transform duration-300 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-bone-dim">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="display text-2xl">{brand.name}</p>
          <p className="mt-2 max-w-xs text-sm text-bone-faint">
            {brand.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone-faint">
          {!soloMode && (
            <Link href="/signup" className="transition-colors hover:text-bone">
              Claim a handle
            </Link>
          )}
          <a
            href={brand.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-bone"
          >
            Instagram
          </a>
          <span>© {new Date().getFullYear()} {brand.domain}</span>
        </div>
      </div>
    </footer>
  );
}
