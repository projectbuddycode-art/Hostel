import type { Metadata } from "next";
import { resetPasswordAction } from "@/server/actions";
import { Notice } from "@/components/editorial";

export const metadata: Metadata = { title: "Choose a password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <section className="mx-auto max-w-md px-5 pb-24 pt-32">
      <h1 className="font-serif text-5xl text-navy">Choose a new password</h1>
      <form action={resetPasswordAction} className="mt-8 space-y-4">
        <Notice error={query.error} />
        <input type="hidden" name="token" value={query.token || ""} />
        <label className="block text-sm">New password<input className="field mt-2" type="password" name="password" required autoComplete="new-password" /></label>
        <label className="block text-sm">Confirm<input className="field mt-2" type="password" name="confirmPassword" required autoComplete="new-password" /></label>
        <button className="btn btn-navy" type="submit">Update password</button>
      </form>
    </section>
  );
}
