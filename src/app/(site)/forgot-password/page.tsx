import type { Metadata } from "next";
import { forgotPasswordAction } from "@/server/actions";
import { Notice } from "@/components/editorial";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string; dev?: string }> }) {
  const query = await searchParams;
  return (
    <section className="mx-auto max-w-md px-5 pb-24 pt-32">
      <h1 className="font-serif text-5xl text-navy">Reset a password</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">If the email belongs to a member, a one-hour link is prepared. It is sent only when email delivery is configured.</p>
      <form action={forgotPasswordAction} className="mt-8 space-y-4">
        <Notice notice={query.notice} error={query.error} />
        {query.dev ? <p className="text-sm">Development link: <a className="underline" href={query.dev}>{query.dev}</a></p> : null}
        <label className="block text-sm">Email<input className="field mt-2" type="email" name="email" required /></label>
        <button className="btn btn-navy" type="submit">Prepare reset</button>
      </form>
    </section>
  );
}
