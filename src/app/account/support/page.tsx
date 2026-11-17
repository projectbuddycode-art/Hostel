import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";
import { contactAction } from "@/server/actions";

export const metadata: Metadata = { title: "Support", robots: { index: false } };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const tickets = await prisma.supportTicket.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <section className="max-w-xl">
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Support</h1>
      <form action={contactAction} className="mt-6 space-y-3">
        <input type="hidden" name="topic" value="support" />
        <input type="hidden" name="name" value={user.name} />
        <input type="hidden" name="email" value={user.email} />
        <input type="hidden" name="phone" value={user.phone} />
        <label className="block text-sm">Subject<input className="field mt-1" name="subject" required /></label>
        <label className="block text-sm">Message<textarea className="field mt-1 min-h-32" name="message" required /></label>
        <button className="btn btn-navy" type="submit">Send to the desk</button>
      </form>
      <div className="mt-8 space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="border border-navy/10 p-4 text-sm">
            <p className="font-medium">{ticket.subject}</p>
            <p className="mt-1 text-ink/70">{ticket.message}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em]">{ticket.status} · {formatWhen(ticket.createdAt)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
