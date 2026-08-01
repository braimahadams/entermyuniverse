"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/app/(auth)/actions";
import { AuthField, AuthShell, authInput } from "@/app/(auth)/AuthShell";
import { brand } from "@/lib/brand";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);
  const [handle, setHandle] = useState("");

  return (
    <AuthShell
      eyebrow="Claim your handle"
      title={
        <>
          Start your <span className="text-gradient">universe</span>.
        </>
      }
      footer={
        <>
          Already have one?{" "}
          <Link
            href="/login"
            className="text-bone underline underline-offset-4 hover:text-ember"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form action={action} className="mt-7 space-y-5">
        <AuthField
          label="Handle"
          // Showing the finished URL as they type is the point of the
          // product in one line — it's the thing they'll paste in a bio.
          hint={`${brand.domain}/@${handle || "yourname"}`}
        >
          <div className="flex items-center rounded-xl border border-line bg-ink/60 pl-4 transition-colors focus-within:border-ember">
            <span className="text-sm text-bone-faint">@</span>
            <input
              name="handle"
              required
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="yourname"
              autoComplete="username"
              maxLength={24}
              className="w-full bg-transparent px-1 py-3.5 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
            />
          </div>
        </AuthField>

        <AuthField label="Display name">
          <input
            name="displayName"
            required
            maxLength={60}
            placeholder="Braima Adams"
            autoComplete="name"
            className={authInput}
          />
        </AuthField>

        <AuthField label="Email">
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            autoComplete="email"
            className={authInput}
          />
        </AuthField>

        <AuthField label="Password" hint="At least 8 characters.">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInput}
          />
        </AuthField>

        {state?.error && (
          <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gradient-to-r from-gold to-ember px-6 py-4 text-sm font-semibold text-ink transition-transform enabled:hover:scale-[1.01] disabled:opacity-50"
        >
          {pending ? "Building it…" : "Create my universe"}
        </button>

        <p className="text-center text-xs leading-relaxed text-bone-faint">
          Publishing is free and always will be. Taking paid bookings is
          switched on account by account while this is young.
        </p>
      </form>
    </AuthShell>
  );
}
