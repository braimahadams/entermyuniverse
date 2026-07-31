/**
 * Avatar with a generated fallback.
 *
 * Nobody uploads a picture on the way in, and a grid of identical grey
 * silhouettes makes a young platform look abandoned. So an account with no
 * image gets a gradient derived from its own name — same name, same colours,
 * every time, which means it reads as an identity rather than a placeholder.
 */
export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-ink ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(140deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 65% 46%))`,
      }}
    >
      {initials}
    </span>
  );
}

export function VerifiedTick({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-label="Verified"
      className="shrink-0"
    >
      <path
        d="M8 1l1.8 1.3 2.2-.2.6 2.1 1.9 1.1-.9 2 .9 2-1.9 1.1-.6 2.1-2.2-.2L8 15l-1.8-1.3-2.2.2-.6-2.1L1.5 10.6l.9-2-.9-2 1.9-1.1.6-2.1 2.2.2L8 1Z"
        fill="var(--color-ember)"
      />
      <path
        d="M5.4 8.2l1.8 1.8 3.4-3.6"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
