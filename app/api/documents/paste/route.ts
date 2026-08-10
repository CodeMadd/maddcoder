import { DocumentStatus } from "@prisma/client";
import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { cleanText } from "@/lib/file/extract";
import { pasteTextSchema } from "@/lib/validation/document";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const userId = await requireApiUser();
  const { filename, text } = await parseBody(req, pasteTextSchema);
  const cleaned = cleanText(text);

  const document = await prisma.document.create({
    data: {
      userId,
      filename: filename.endsWith(".txt") ? filename : `${filename}.txt`,
      fileType: "txt",
      fileSize: Buffer.byteLength(cleaned, "utf-8"),
      extractedText: cleaned,
      status: DocumentStatus.READY,
    },
  });
  return ok(
    { document: { ...document, extractedText: undefined } },
    { status: 201 },
  );
});
