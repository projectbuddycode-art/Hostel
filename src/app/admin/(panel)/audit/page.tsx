import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";

export const metadata: Metadata = { title: "Audit", robots: { index: false, follow: false } };

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Audit</h1>
      <div className="mt-6 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatWhen(log.createdAt)}</td>
                <td>{log.actor?.name || "System"}</td>
                <td>{log.action}</td>
                <td>{log.entity} {log.entityId}<p className="max-w-sm text-xs text-ink/60">{log.metadata}</p></td>
              </tr>
            ))}
            {!logs.length ? <tr><td colSpan={4}>No audited actions yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
