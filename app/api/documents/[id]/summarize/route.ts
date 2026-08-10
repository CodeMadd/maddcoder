import { requireApiUser, handle, parseBody, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedDocument } from "@/lib/ownership";
import {
  checkUsageLimit,
  recordAIUsage,
  DOCUMENT_SUMMARY_FEATURE,
} from "@/lib/usage";
import { summarizeSchema } from "@/lib/validation/document";
import { summarizeDocument } from "@/lib/ai/services/document-ai";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);
  const { mode } = await parseBody(req, summarizeSchema);

  if (!document.extractedText?.trim()) {
    throw new ApiError(422, "This document has no extractable text to summarize.");
  }

  await checkUsageLimit(userId, "document_summary");

  const { data, tokensUsed } = await summarizeDocument(
    document.extractedText,
    mode,
  );

  await recordAIUsage(userId, DOCUMENT_SUMMARY_FEATURE, tokensUsed);
  const updated = await prisma.document.update({
    where: { id: document.id },
    data: { summary: data as unknown as Prisma.InputJsonValue },
    select: { id: true, summary: true },
  });

  return ok({ summary: updated.summary });
});
