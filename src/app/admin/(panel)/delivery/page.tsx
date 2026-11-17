import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { businessToday } from "@/lib/dates";
import { assignDeliveryAction, orderStatusAction } from "@/server/actions";

export const metadata: Metadata = { title: "Delivery", robots: { index: false, follow: false } };

export default async function DeliveryPage({ searchParams }: { searchParams: Promise<{ date?: string; notice?: string; error?: string }> }) {
  const query = await searchParams;
  const date = query.date || businessToday();
  const orders = await prisma.order.findMany({
    where: { selection: { date }, status: { notIn: ["CANCELLED"] } },
    include: { selection: true, assignment: true, user: true },
    orderBy: { zone: "asc" },
  });
  const zones = [...new Set(orders.map((order) => order.zone || "Unzoned"))];
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Delivery</h1>
      <form method="get" className="mt-6 flex gap-2">
        <input className="field max-w-[12rem]" type="date" name="date" defaultValue={date} aria-label="Date" />
        <button className="btn btn-navy" type="submit">Show routes</button>
      </form>
      {zones.map((zone) => (
        <section key={zone} className="mt-8">
          <h2 className="font-serif text-3xl text-navy">{zone}</h2>
          <div className="mt-3 space-y-4">
            {orders.filter((order) => (order.zone || "Unzoned") === zone).map((order) => (
              <article key={order.id} className="border border-navy/10 p-4 text-sm">
                <p className="font-medium">{order.user.name} · {order.dishName} · {order.selection.mealType}</p>
                <p>{order.addressSnapshot}</p>
                <p>Status {order.status}{order.assignment ? ` · ${order.assignment.personnelName}` : ""}</p>
                <form action={assignDeliveryAction} className="mt-3 grid gap-2 md:grid-cols-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input className="field" name="personnelName" placeholder="Name" defaultValue={order.assignment?.personnelName} aria-label="Personnel name" required />
                  <input className="field" name="personnelPhone" placeholder="Phone" defaultValue={order.assignment?.personnelPhone} aria-label="Personnel phone" />
                  <input className="field" name="notes" placeholder="Note" defaultValue={order.assignment?.notes} aria-label="Delivery note" />
                  <button className="btn btn-line-dark" type="submit">Assign</button>
                </form>
                <form action={orderStatusAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="back" value="/admin/delivery" />
                  <select className="field max-w-[14rem]" name="status" defaultValue={order.status} aria-label="Delivery status">
                    <option>DISPATCHED</option><option>DELIVERED</option><option>FAILED</option>
                  </select>
                  <button className="btn btn-navy" type="submit">Update delivery</button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ))}
      {!orders.length ? <p className="mt-6">No deliveries on this date.</p> : null}
    </section>
  );
}
