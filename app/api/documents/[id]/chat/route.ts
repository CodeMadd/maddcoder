import { MessageRole } from "@prisma/client";
import { requireApiUser, handle, parseBody, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedDocument } from "@/lib/ownership";
import { checkUsageLimit, recordAIUsage } from "@/lib/usage";
import { chatSchema } from "@/lib/validation/document";
import { chatWithDocument } from "@/lib/ai/services/document-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);
  const messages = await prisma.message.findMany({
    where: { documentId: document.id },
    orderBy: { createdAt: "asc" },
  });
  return ok({ messages });
});

export const POST = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);
  const { message } = await parseBody(req, chatSchema);

  if (!document.extractedText?.trim()) {
    throw new ApiError(422, "This document has no text to answer questions from.");
  }

  await checkUsageLimit(userId, "ai");

  await prisma.message.create({
    data: { documentId: document.id, userId, role: MessageRole.USER, content: message },
  });

  const { data, tokensUsed } = await chatWithDocument(
    message,
    document.extractedText,
  );

  await recordAIUsage(userId, "document_chat", tokensUsed);
  const assistant = await prisma.message.create({
    data: {
      documentId: document.id,
      userId,
      role: MessageRole.ASSISTANT,
      content: data.answer,
    },
  });

  return ok({ message: assistant });
});
