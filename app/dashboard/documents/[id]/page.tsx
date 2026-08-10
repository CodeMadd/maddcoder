import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getOwnedDocument } from "@/lib/ownership";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import type { DocumentSummary } from "@/lib/ai/services/document-ai";

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();

  let document;
  try {
    document = await getOwnedDocument(user.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const messages = await prisma.message.findMany({
    where: { documentId: document.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });

  return (
    <>
      <Link
        href="/dashboard/documents"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My Documents
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{document.filename}</h1>
        <Badge variant="muted">{document.fileType.toUpperCase()}</Badge>
        <span className="text-sm text-muted-foreground">
          {formatBytes(document.fileSize)} · {formatDate(document.createdAt)}
        </span>
      </div>

      <DocumentWorkspace
        id={document.id}
        filename={document.filename}
        status={document.status}
        initialSummary={(document.summary as unknown as DocumentSummary) ?? null}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
      />
    </>
  );
}
