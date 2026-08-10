import { requireApiUser, handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedDocument } from "@/lib/ownership";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);
  return ok({ document });
});

export const DELETE = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);

  if (document.storageKey) {
    // Secure deletion of the stored file, then the record (messages cascade).
    await getStorage().delete(document.storageKey);
  }
  await prisma.document.delete({ where: { id: document.id } });
  return ok({ success: true });
});
