import Link from "next/link";
import { Logo } from "@/components/chrome";
import { requireUser } from "@/lib/auth/guard";
import { logoutAction } from "@/server/actions";

const links = [
  ["/account", "Overview"],
  ["/account/membership", "Membership"],
  ["/account/meals", "Meals"],
  ["/account/orders", "Deliveries"],
  ["/account/payments", "Payments"],
  ["/account/addresses", "Addresses"],
  ["/account/preferences", "Preferences"],
  ["/account/support", "Support"],
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="border-b border-navy/10">
        <div className="mx-auto flex h-20 max-w-page items-center justify-between px-5 md:px-10">
          <Link href="/" aria-label="THE HOSTELS home"><Logo /></Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline">{user.name}</span>
            <form action={logoutAction}><button className="text-[0.72rem] uppercase tracking-[0.16em]" type="submit">Sign out</button></form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-page gap-8 px-5 py-8 md:grid-cols-[200px_1fr] md:px-10">
        <nav aria-label="Your table" className="flex gap-4 overflow-x-auto md:flex-col md:overflow-visible">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap text-sm text-navy/80 hover:text-navy">{label}</Link>
          ))}
        </nav>
        <div id="content">{children}</div>
      </div>
    </div>
  );
}
