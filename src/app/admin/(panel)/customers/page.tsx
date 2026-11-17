import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; notice?: string; error?: string }> }) {
  const query = await searchParams;
  const q = query.q?.trim() || "";
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(query.status ? { status: query.status } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    include: { subscriptions: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Customers</h1>
      <form className="mt-6 flex flex-wrap gap-2" method="get">
        <input className="field max-w-xs" name="q" defaultValue={q} placeholder="Name, email or phone" aria-label="Search customers" />
        <select className="field max-w-[10rem]" name="status" defaultValue={query.status || ""} aria-label="Status">
          <option value="">Any status</option>
          <option>ACTIVE</option>
          <option>SUSPENDED</option>
        </select>
        <button className="btn btn-navy" type="submit">Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Membership</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td><Link className="underline" href={`/admin/customers/${customer.id}`}>{customer.name}</Link></td>
                <td>{customer.email}</td>
                <td>{customer.status}</td>
                <td>{customer.subscriptions[0]?.plan.name || "—"}</td>
              </tr>
            ))}
            {!customers.length ? <tr><td colSpan={4}>No customers match.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
