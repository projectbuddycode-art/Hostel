import type { Metadata } from "next";
import { zones } from "@/lib/config";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { defaultAddressAction, saveAddressAction } from "@/server/actions";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Addresses</h1>
      <div className="mt-6 space-y-3">
        {addresses.map((address) => (
          <article key={address.id} className="flex items-start justify-between gap-4 border border-navy/10 p-4">
            <p className="text-sm leading-6">{address.label}{address.isDefault ? " · Default" : ""}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city} {address.postalCode} · {address.zone}</p>
            {!address.isDefault ? (
              <form action={defaultAddressAction}>
                <input type="hidden" name="addressId" value={address.id} />
                <button className="text-sm underline" type="submit">Make default</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
      <form action={saveAddressAction} className="mt-8 grid max-w-xl gap-3">
        <h2 className="font-serif text-3xl text-navy">Add an address</h2>
        <label className="text-sm">Label<input className="field mt-1" name="label" defaultValue="Home" required /></label>
        <label className="text-sm">Address<input className="field mt-1" name="line1" required /></label>
        <label className="text-sm">Line 2<input className="field mt-1" name="line2" /></label>
        <label className="text-sm">City<input className="field mt-1" name="city" required /></label>
        <label className="text-sm">State<input className="field mt-1" name="state" /></label>
        <label className="text-sm">Postal code<input className="field mt-1" name="postalCode" required /></label>
        <label className="text-sm">Zone
          <select className="field mt-1" name="zone" defaultValue="Central">{zones.map((zone) => <option key={zone}>{zone}</option>)}</select>
        </label>
        <button className="btn btn-navy" type="submit">Save address</button>
      </form>
    </section>
  );
}
