/**
 * The light in the room.
 *
 * Three heavily blurred colour fields drifting on long, mismatched loops
 * so the background never visibly repeats. Pure CSS — no JS, no canvas,
 * no cost on the main thread, and it stays a server component.
 */
export function Ambience() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="aurora"
        style={{
          top: "-18%",
          left: "-10%",
          width: "58vw",
          height: "58vw",
          background:
            "radial-gradient(circle, rgba(255,122,69,0.20) 0%, rgba(255,122,69,0) 68%)",
          animation: "drift-a 26s ease-in-out infinite",
        }}
      />
      <div
        className="aurora"
        style={{
          top: "26%",
          right: "-18%",
          width: "52vw",
          height: "52vw",
          background:
            "radial-gradient(circle, rgba(124,92,255,0.16) 0%, rgba(124,92,255,0) 68%)",
          animation: "drift-b 34s ease-in-out infinite",
        }}
      />
      <div
        className="aurora"
        style={{
          bottom: "-22%",
          left: "22%",
          width: "62vw",
          height: "48vw",
          background:
            "radial-gradient(circle, rgba(255,178,107,0.10) 0%, rgba(255,178,107,0) 70%)",
          animation: "drift-a 44s ease-in-out infinite reverse",
        }}
      />

      {/* Vignette. Pulls the eye to the centre column and stops the
          aurora from washing out text near the edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 30%, rgba(7,7,10,0.55) 78%, rgba(7,7,10,0.9) 100%)",
        }}
      />
    </div>
  );
}
