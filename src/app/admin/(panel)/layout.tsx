import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/chrome";
import { staffNav } from "@/lib/auth/access";
import { clearSessionCookie, getSession } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/server/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role === "CUSTOMER") redirect("/admin/login");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.status !== "ACTIVE" || !["ADMIN", "KITCHEN", "DELIVERY"].includes(user.role)) {
    await clearSessionCookie();
    redirect("/admin/login");
  }
  const links = staffNav(user.role);
  return (
    <div className="min-h-screen bg-[#f7f3eb] text-ink">
      <header className="border-b border-navy/10 bg-ivory">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-5">
          <Link href="/admin" aria-label="Desk home"><Logo /></Link>
          <div className="flex items-center gap-4 text-sm">
            <span>{user.name} · {user.role.toLowerCase()}</span>
            <form action={logoutAction}>
              <input type="hidden" name="next" value="admin" />
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-page gap-8 px-5 py-8 lg:grid-cols-[180px_1fr]">
        <nav className="flex gap-4 overflow-x-auto lg:flex-col" aria-label="Desk">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-sm">{link.label}</Link>
          ))}
        </nav>
        <div id="content">{children}</div>
      </div>
    </div>
  );
}
