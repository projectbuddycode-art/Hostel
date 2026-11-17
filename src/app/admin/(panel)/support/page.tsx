import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";
import { supportStatusAction } from "@/server/actions";

export const metadata: Metadata = { title: "Desk messages", robots: { index: false, follow: false } };

export default async function SupportAdmin({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Desk</h1>
      <div className="mt-6 space-y-4">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="border border-navy/10 p-4 text-sm">
            <p className="font-medium">{ticket.subject}</p>
            <p>{ticket.name} · {ticket.email} · {ticket.topic}</p>
            <p className="mt-2">{ticket.message}</p>
            <p className="mt-2 text-xs">{ticket.status} · {formatWhen(ticket.createdAt)}</p>
            <form action={supportStatusAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={ticket.id} />
              <select className="field max-w-[12rem]" name="status" defaultValue={ticket.status} aria-label="Ticket status"><option>OPEN</option><option>ANSWERED</option><option>CLOSED</option></select>
              <button className="btn btn-line-dark" type="submit">Update</button>
            </form>
          </article>
        ))}
        {!tickets.length ? <p>The desk is clear.</p> : null}
      </div>
    </section>
  );
}
