"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/(auth)/actions";
import { AuthField, AuthShell, authInput } from "@/app/(auth)/AuthShell";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Let yourself in."
      footer={
        <>
          No universe yet?{" "}
          <Link
            href="/signup"
            className="text-bone underline underline-offset-4 hover:text-ember"
          >
            Claim a handle
          </Link>
        </>
      }
    >
      <form action={action} className="mt-7 space-y-5">
        <AuthField label="Email">
          <input
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@email.com"
            className={authInput}
          />
        </AuthField>

        <AuthField label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          className="w-full rounded-full bg-bone px-6 py-4 text-sm font-semibold text-ink transition-transform enabled:hover:scale-[1.01] disabled:opacity-50"
        >
          {pending ? "…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
