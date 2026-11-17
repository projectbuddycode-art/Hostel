import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/server/actions";
import { Notice } from "@/components/editorial";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  return (
    <section className="mx-auto max-w-md px-5 pb-24 pt-32">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Members</p>
      <h1 className="mt-3 font-serif text-5xl text-navy">Sign in</h1>
      <form action={loginAction} className="mt-8 space-y-4">
        <Notice error={query.error} />
        <input type="hidden" name="next" value={query.next || "/account"} />
        <label className="block text-sm">Email<input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
        <label className="block text-sm">Password<input className="field mt-2" type="password" name="password" required autoComplete="current-password" /></label>
        <button className="btn btn-navy w-full" type="submit">Sign in</button>
      </form>
      <p className="mt-6 text-sm"><Link className="underline" href="/forgot-password">Forgot password</Link></p>
      <p className="mt-2 text-sm">New to the house? <Link className="underline" href="/register">Create an account</Link></p>
    </section>
  );
}
