import Link from "next/link";
import { Ambience } from "@/components/Ambience";
import { brand } from "@/lib/brand";

export function AuthShell({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <>
      <Ambience />
      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center justify-center gap-2 text-sm text-bone-faint transition-colors hover:text-bone"
          >
            {brand.name}
          </Link>

          <div className="card rounded-3xl p-8">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="display mt-3 text-3xl leading-tight">{title}</h1>
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-bone-dim">{footer}</p>
        </div>
      </main>
    </>
  );
}

export const authInput =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-sm text-bone placeholder:text-bone-faint transition-colors focus:border-ember focus:outline-none";

export function AuthField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-bone-faint">{hint}</span>
      )}
    </label>
  );
}
