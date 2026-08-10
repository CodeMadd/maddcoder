import { DocumentStatus } from "@prisma/client";
import { requireApiUser, handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/plans";
import { getStorage, documentStorageKey } from "@/lib/storage";
import { extractText, type ExtractableType } from "@/lib/file/extract";
import { SUPPORTED_MIME } from "@/lib/validation/document";
import { formatBytes } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

function resolveType(mime: string, filename: string): ExtractableType | null {
  if (mime in SUPPORTED_MIME) {
    return SUPPORTED_MIME[mime as keyof typeof SUPPORTED_MIME];
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}

export const POST = handle(async (req) => {
  const userId = await requireApiUser();
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "No file was uploaded.");
  }

  const type = resolveType(file.type, file.name);
  if (!type) {
    throw new ApiError(415, "Unsupported file type. Upload a PDF, DOCX, or TXT.");
  }
  if (file.size === 0) {
    throw new ApiError(422, "The uploaded file is empty.");
  }
  if (file.size > limits.maxDocumentBytes) {
    throw new ApiError(
      413,
      `File too large. Maximum size on your plan is ${formatBytes(limits.maxDocumentBytes)}.`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const document = await prisma.document.create({
    data: {
      userId,
      filename: file.name,
      fileType: type,
      fileSize: file.size,
      status: DocumentStatus.PROCESSING,
    },
  });

  try {
    const storage = getStorage();
    const key = documentStorageKey(userId, document.id, file.name);
    await storage.put(key, buffer, file.type);

    const text = await extractText(buffer, type);
    if (!text.trim()) {
      throw new Error("No extractable text found.");
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        storageKey: key,
        extractedText: text,
        status: DocumentStatus.READY,
      },
    });
    return ok(
      { document: { ...updated, extractedText: undefined } },
      { status: 201 },
    );
  } catch {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.FAILED,
        error: "Could not extract text from this document.",
      },
    });
    throw new ApiError(
      422,
      "Could not process this document. It may be corrupted or contain no selectable text.",
    );
  }
});
