import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { createStaffAction } from "@/server/actions";

export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const staff = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "KITCHEN", "DELIVERY"] } }, orderBy: { name: "asc" } });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Staff</h1>
      <p className="mt-3 max-w-xl text-sm">Kitchen and delivery accounts are created here. There is no public staff registration. Share the first password privately.</p>
      <form action={createStaffAction} className="mt-6 grid max-w-md gap-3">
        <input className="field" name="name" placeholder="Name" required aria-label="Name" />
        <input className="field" type="email" name="email" placeholder="Email" required aria-label="Email" />
        <input className="field" name="phone" placeholder="Phone" aria-label="Phone" />
        <select className="field" name="role" aria-label="Role"><option>KITCHEN</option><option>DELIVERY</option></select>
        <input className="field" type="password" name="password" placeholder="Temporary password" required aria-label="Temporary password" />
        <button className="btn btn-navy" type="submit">Create staff account</button>
      </form>
      <ul className="mt-8 space-y-2 text-sm">{staff.map((person) => <li key={person.id}>{person.name} · {person.email} · {person.role} · {person.status}</li>)}</ul>
    </section>
  );
}
