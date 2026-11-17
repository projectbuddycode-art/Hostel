import Link from "next/link";
import { Logo } from "@/components/chrome";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-navy/10">
        <div className="mx-auto flex h-20 max-w-3xl items-center px-5">
          <Link href="/" aria-label="THE HOSTELS home"><Logo /></Link>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-3xl px-5 py-12">{children}</main>
    </div>
  );
}
