import { prisma } from "@/lib/db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      metadata: JSON.stringify(metadata).slice(0, 4000),
    },
  });
}
