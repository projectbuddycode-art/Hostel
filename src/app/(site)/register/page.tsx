import type { Metadata } from "next";
import Link from "next/link";
import { dietaryOptions, zones } from "@/lib/config";
import { Notice } from "@/components/editorial";
import { registerAction } from "@/server/actions";

export const metadata: Metadata = { title: "Register", description: "Open a table at THE HOSTELS.", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  return (
    <section className="mx-auto max-w-2xl px-5 pb-24 pt-32">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Members</p>
      <h1 className="mt-3 font-serif text-5xl text-navy">Open your table</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">Passwords are stored hashed. Dietary notes are for the kitchen, not for a medical record.</p>
      <form action={registerAction} className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Notice error={query.error} /></div>
        <input type="hidden" name="next" value={query.next || "/account"} />
        <label className="block text-sm md:col-span-2">Full name<input className="field mt-2" name="name" required autoComplete="name" /></label>
        <label className="block text-sm">Email<input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
        <label className="block text-sm">Phone<input className="field mt-2" name="phone" required autoComplete="tel" /></label>
        <label className="block text-sm">Password<input className="field mt-2" type="password" name="password" required autoComplete="new-password" /></label>
        <label className="block text-sm">Confirm password<input className="field mt-2" type="password" name="confirmPassword" required autoComplete="new-password" /></label>
        <label className="block text-sm md:col-span-2">Address<input className="field mt-2" name="line1" required autoComplete="address-line1" /></label>
        <label className="block text-sm">Address line 2<input className="field mt-2" name="line2" autoComplete="address-line2" /></label>
        <label className="block text-sm">City<input className="field mt-2" name="city" required autoComplete="address-level2" /></label>
        <label className="block text-sm">State<input className="field mt-2" name="state" autoComplete="address-level1" /></label>
        <label className="block text-sm">Postal code<input className="field mt-2" name="postalCode" required inputMode="numeric" autoComplete="postal-code" /></label>
        <label className="block text-sm md:col-span-2">Delivery zone
          <select className="field mt-2" name="zone" defaultValue="Central">
            {zones.map((zone) => <option key={zone}>{zone}</option>)}
          </select>
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm">Dietary preferences</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {dietaryOptions.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="dietary" value={option.id} /> {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm md:col-span-2">Allergies, separated by commas<textarea className="field mt-2" name="allergies" /></label>
        <label className="flex items-start gap-3 text-sm md:col-span-2">
          <input type="checkbox" name="whatsappOptIn" className="mt-1" />
          <span>Send membership and delivery messages on WhatsApp when a template and my permission are both in place.</span>
        </label>
        <button className="btn btn-navy md:col-span-2" type="submit">Create account</button>
      </form>
      <p className="mt-6 text-sm">Already registered? <Link className="underline" href="/login">Sign in</Link></p>
    </section>
  );
}
