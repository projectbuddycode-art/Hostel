import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { parseList } from "@/lib/json";
import { adjustCreditsAction, offlinePaymentAction, updateCustomerStatusAction } from "@/server/actions";

export const metadata: Metadata = { title: "Customer", robots: { index: false, follow: false } };

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      profile: true,
      addresses: true,
      subscriptions: { include: { plan: true, payments: true }, orderBy: { createdAt: "desc" } },
      orders: { include: { selection: true }, orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!customer) notFound();
  const pending = customer.subscriptions.find((item) => item.status === "PENDING_PAYMENT");
  const active = customer.subscriptions.find((item) => item.status === "ACTIVE");
  return (
    <section className="space-y-8">
      <Notice notice={query.notice} error={query.error} />
      <div>
        <h1 className="font-serif text-5xl text-navy">{customer.name}</h1>
        <p className="mt-2 text-sm">{customer.email} · {customer.phone || "No phone"} · {customer.status}</p>
        <p className="mt-2 text-sm">Diet: {parseList(customer.profile?.dietaryPreferences).join(", ") || "None listed"} · Allergies: {customer.profile?.allergies || "None listed"} · Spice: {customer.profile?.spicePreference}</p>
      </div>
      <form action={updateCustomerStatusAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={customer.id} />
        <label className="text-sm">Status
          <select className="field mt-1" name="status" defaultValue={customer.status}><option>ACTIVE</option><option>SUSPENDED</option></select>
        </label>
        <button className="btn btn-navy" type="submit">Update status</button>
      </form>
      <div>
        <h2 className="font-serif text-3xl text-navy">Addresses</h2>
        {customer.addresses.map((address) => <p key={address.id} className="mt-2 text-sm">{address.line1}, {address.city} {address.postalCode} · {address.zone}{address.isDefault ? " · default" : ""}</p>)}
      </div>
      <div>
        <h2 className="font-serif text-3xl text-navy">Memberships</h2>
        {customer.subscriptions.map((subscription) => (
          <article key={subscription.id} className="mt-3 border border-navy/10 p-4 text-sm">
            <p>{subscription.plan.name} · {subscription.status} · {formatINR(subscription.pricePaise)} · {subscription.mealsRemaining} credits</p>
            <p>{subscription.startDate || "Not started"} to {subscription.endDate || "—"}</p>
          </article>
        ))}
      </div>
      {active ? (
        <form action={adjustCreditsAction} className="grid max-w-md gap-3 border border-navy/10 p-4">
          <h2 className="font-serif text-2xl">Adjust credits</h2>
          <input type="hidden" name="subscriptionId" value={active.id} />
          <label className="text-sm">Balance<input className="field mt-1" name="credits" type="number" min="0" defaultValue={active.mealsRemaining} required /></label>
          <label className="text-sm">Reason<input className="field mt-1" name="note" required /></label>
          <button className="btn btn-line-dark" type="submit">Save credits</button>
        </form>
      ) : null}
      {pending ? (
        <form action={offlinePaymentAction} className="grid max-w-md gap-3 border border-navy/10 p-4">
          <h2 className="font-serif text-2xl">Record an offline payment</h2>
          <p className="text-sm">This activates the pending {pending.plan.name} term for {formatINR(pending.pricePaise)}. It is a record of money already received, not a simulated gateway success.</p>
          <input type="hidden" name="subscriptionId" value={pending.id} />
          <label className="text-sm">How it was received<input className="field mt-1" name="note" required /></label>
          <button className="btn btn-navy" type="submit">Record and activate</button>
        </form>
      ) : null}
      <div className="overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Date</th><th>Meal</th><th>Dish</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {customer.orders.map((order) => (
              <tr key={order.id}><td>{order.selection.date}</td><td>{order.selection.mealType}</td><td>{order.dishName}</td><td>{order.status}</td><td>{order.instructions}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
