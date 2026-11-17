import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { checkoutAction } from "@/server/actions";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const plan = await prisma.plan.findUnique({ where: { slug } });
  if (!plan || !plan.active) notFound();
  const addresses = await prisma.address.findMany({ where: { userId: user.id } });
  return (
    <section>
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Checkout</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">{plan.name}</h1>
      <Notice error={query.error} />
      {!plan.purchasable || plan.pricePaise <= 0 ? (
        <p className="mt-4">This membership is arranged with the dining desk. <Link className="underline" href="/corporate">Request a proposal</Link>.</p>
      ) : (
        <>
          <p className="mt-4 font-serif text-4xl">{formatINR(plan.pricePaise)}</p>
          <p className="mt-3 text-sm leading-6 text-ink/70">{plan.priceNote}</p>
          <p className="mt-3 text-sm leading-6 text-ink/70">{plan.upgradeNotes} The membership stays pending until Razorpay verifies the payment, or until the dining desk records a payment taken outside the gateway.</p>
          {!addresses.length ? (
            <p className="mt-6">Add a delivery address before checkout. <Link className="underline" href="/account/addresses">Addresses</Link></p>
          ) : (
            <form action={checkoutAction} className="mt-6 space-y-3">
              <input type="hidden" name="planSlug" value={plan.slug} />
              {addresses.map((address) => (
                <label key={address.id} className="flex gap-3 border border-navy/10 p-3 text-sm">
                  <input type="radio" name="addressId" value={address.id} defaultChecked={address.isDefault} required />
                  <span>{address.line1}, {address.city} {address.postalCode} · {address.zone}</span>
                </label>
              ))}
              <button className="btn btn-navy" type="submit">Continue to payment</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
