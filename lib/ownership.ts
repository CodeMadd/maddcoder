import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";

/**
 * Loads a resume and verifies it belongs to the user. Returns 404 (not 403)
 * so IDs are not enumerable. A user can never access another user's resume.
 */
export async function getOwnedResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw new ApiError(404, "Resume not found.");
  return resume;
}

export async function getOwnedDocument(userId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });
  if (!document) throw new ApiError(404, "Document not found.");
  return document;
}
