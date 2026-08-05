import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { logout } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/auth";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-[100svh] bg-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="display text-lg">
              {brand.short}
            </Link>
            <nav className="flex flex-wrap gap-1">
              <NavLink href="/studio">Overview</NavLink>
              <NavLink href="/studio/write">Write</NavLink>
              <NavLink href="/studio/replies">Replies</NavLink>
              {user.canSell && (
                <>
                  <NavLink href="/studio/offers">Offers</NavLink>
                  <NavLink href="/studio/hours">Hours</NavLink>
                </>
              )}
              <NavLink href="/studio/profile">Profile</NavLink>
              {user.isAdmin && <NavLink href="/admin">Admin</NavLink>}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/@${user.handle}`}
              target="_blank"
              className="flex items-center gap-2 text-xs text-bone-faint transition-colors hover:text-bone"
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size={22} />
              @{user.handle} ↗
            </Link>
            <form action={logout}>
              <button className="rounded-full border border-line px-3.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-line-bright hover:text-bone">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3.5 py-1.5 text-sm text-bone-dim transition-colors hover:bg-bone/5 hover:text-bone"
    >
      {children}
    </Link>
  );
}
