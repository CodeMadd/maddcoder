"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Eye, Trash2, Download, Files } from "lucide-react";

import { apiFetch } from "@/lib/client";
import { formatDate, formatBytes } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

type Doc = {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
};

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "muted" | "destructive" }> = {
  READY: { label: "Ready", variant: "success" },
  PROCESSING: { label: "Processing", variant: "warning" },
  UPLOADED: { label: "Uploaded", variant: "muted" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function DocumentsList({ initial }: { initial: Doc[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState(initial);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/documents/${deleting.id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== deleting.id));
      toast.success("Document deleted");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (docs.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Files className="size-6" />
        </span>
        <p className="text-muted-foreground">No documents yet.</p>
        <Link href="/dashboard/documents/new" className={buttonVariants({ variant: "gradient" })}>
          Summarize a document
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y">
          {docs.map((d) => {
            const s = STATUS[d.status] ?? STATUS.UPLOADED;
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/documents/${d.id}`} className="block truncate font-medium hover:text-primary">
                    {d.filename}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {d.fileType.toUpperCase()} · {formatBytes(d.fileSize)} · {formatDate(d.createdAt)}
                  </div>
                </div>
                <Badge variant={s.variant}>{s.label}</Badge>
                <div className="flex gap-1">
                  <Link href={`/dashboard/documents/${d.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Eye className="size-3.5" /> View
                  </Link>
                  <a
                    href={`/api/documents/${d.id}/download?format=txt`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    title="Download summary"
                  >
                    <Download className="size-3.5" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(d)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete document?"
        description={`"${deleting?.filename}" and its summary will be permanently deleted.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete} loading={busy}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
