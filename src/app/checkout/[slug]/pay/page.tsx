import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PayPanel } from "@/components/pay-panel";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const payment = await prisma.payment.findFirst({
    where: { id: query.payment, userId: user.id },
    include: { subscription: { include: { plan: true } } },
  });
  if (!payment || payment.subscription?.plan.slug !== slug) notFound();
  if (payment.status === "PAID") redirect("/account?notice=Membership confirmed");
  return (
    <section>
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Payment</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">{payment.subscription?.plan.name}</h1>
      {payment.status === "CREATED" ? (
        <div className="mt-6">
          <PayPanel paymentId={payment.id} amountPaise={payment.amountPaise} planName={payment.subscription?.plan.name || "Membership"} />
        </div>
      ) : (
        <div className="mt-6">
          <p>This payment is {payment.status.toLowerCase()} and has not activated a membership.</p>
          <Link href={`/checkout/${slug}`} className="btn btn-navy mt-4">Start again</Link>
        </div>
      )}
    </section>
  );
}
