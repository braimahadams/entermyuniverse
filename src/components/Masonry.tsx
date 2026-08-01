/**
 * Masonry via CSS columns.
 *
 * No JavaScript, no layout measurement, no shift after hydration — the
 * browser does it natively. The one rule it demands is that children set
 * `break-inside: avoid`, which ThoughtCard does.
 *
 * The tradeoff is that CSS columns order top-to-bottom within a column
 * rather than left-to-right across rows. For a library of ideas with no
 * chronological promise that's fine, and arguably better: it invites
 * browsing rather than reading in sequence.
 */
export function Masonry({ children }: { children: React.ReactNode }) {
  return (
    <div className="columns-1 gap-5 sm:columns-2 sm:gap-6 lg:columns-3 [&>*]:mb-5 sm:[&>*]:mb-6">
      {children}
    </div>
  );
}
