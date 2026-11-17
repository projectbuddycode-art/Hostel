import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";
import { formatINRExact } from "@/lib/format";

export const metadata: Metadata = { title: "Deliveries", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { selection: true, events: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Deliveries</h1>
      <div className="mt-6 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Date</th><th>Service</th><th>Dish</th><th>Status</th><th>Extras</th><th>Latest</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.selection.date}</td>
                <td className="capitalize">{order.selection.mealType}</td>
                <td>{order.dishName}<p className="text-xs text-ink/60">{order.addressSnapshot}</p></td>
                <td>{order.status}</td>
                <td>{formatINRExact(order.totalPaise)}</td>
                <td>{order.events[0] ? `${order.events[0].status} · ${formatWhen(order.events[0].createdAt)}` : "—"}</td>
              </tr>
            ))}
            {!orders.length ? <tr><td colSpan={6}>No orders yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
