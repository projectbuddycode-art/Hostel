import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { approveRequestAction, orderStatusAction } from "@/server/actions";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ date?: string; meal?: string; notice?: string; error?: string }> }) {
  const query = await searchParams;
  const orders = await prisma.order.findMany({
    where: {
      ...(query.date || query.meal ? { selection: { ...(query.date ? { date: query.date } : {}), ...(query.meal ? { mealType: query.meal } : {}) } } : {}),
    },
    include: { selection: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Orders</h1>
      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input className="field max-w-[12rem]" type="date" name="date" defaultValue={query.date} aria-label="Date" />
        <select className="field max-w-[12rem]" name="meal" defaultValue={query.meal || ""} aria-label="Meal">
          <option value="">All services</option><option>breakfast</option><option>lunch</option><option>dinner</option>
        </select>
        <button className="btn btn-navy" type="submit">Filter</button>
      </form>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="border border-navy/10 p-4 text-sm">
            <p className="font-serif text-2xl text-navy">{order.dishName}</p>
            <p>{order.selection.date} · {order.selection.mealType} · {order.user.name}</p>
            <p>{order.addressSnapshot}</p>
            {order.allergyWarning ? <p className="mt-1 text-red-900">{order.allergyWarning}</p> : null}
            {order.instructions ? <p className="mt-1">Note: {order.instructions}</p> : null}
            <p className="mt-1">Status {order.status} · Request {order.requestStatus}</p>
            <form action={orderStatusAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="back" value="/admin/orders" />
              <select className="field max-w-[12rem]" name="status" defaultValue={order.status} aria-label="Order status">
                {["CONFIRMED", "PREPARING", "PACKED", "DISPATCHED", "DELIVERED", "FAILED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <button className="btn btn-line-dark" type="submit">Update</button>
            </form>
            {order.requestStatus === "PENDING" ? (
              <form action={approveRequestAction} className="mt-2 flex gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <button className="btn btn-navy" name="requestStatus" value="APPROVED" type="submit">Approve note</button>
                <button className="btn btn-line-dark" name="requestStatus" value="DECLINED" type="submit">Decline note</button>
              </form>
            ) : null}
          </article>
        ))}
        {!orders.length ? <p>No orders for this filter.</p> : null}
      </div>
    </section>
  );
}
