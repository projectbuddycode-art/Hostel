import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { adminLoginAction, skipAdminLoginAction } from "@/server/actions";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <main id="content" className="grid min-h-screen place-items-center bg-navy px-5 text-ivory">
      <section className="w-full max-w-md">
        <p className="text-[0.68rem] uppercase tracking-[0.32em] text-gold">Staff</p>
        <h1 className="mt-3 font-serif text-5xl font-light">Dining desk</h1>
        <p className="mt-3 text-sm text-ivory/70">There is no public registration for this entrance.</p>
        <form action={adminLoginAction} className="mt-8 space-y-4">
          <Notice error={query.error} />
          <label className="block text-sm">Email<input className="field mt-2 text-navy" type="email" name="email" required autoComplete="username" /></label>
          <label className="block text-sm">Password<input className="field mt-2 text-navy" type="password" name="password" required autoComplete="current-password" /></label>
          <button className="btn btn-gold" type="submit">Enter</button>
        </form>
        <form action={skipAdminLoginAction} className="mt-6">
          <button className="btn btn-line" type="submit">Skip login and view the dashboard</button>
        </form>
      </section>
    </main>
  );
}
