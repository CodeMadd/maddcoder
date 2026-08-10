"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileStack,
  Pencil,
  Copy,
  Download,
  Trash2,
  Plus,
  Type,
} from "lucide-react";

import { apiFetch } from "@/lib/client";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ResumeCard = {
  id: string;
  name: string;
  template: string;
  atsScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export function ResumesList({ initial }: { initial: ResumeCard[] }) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initial);
  const [renaming, setRenaming] = useState<ResumeCard | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ResumeCard | null>(null);
  const [busy, setBusy] = useState(false);

  async function duplicate(r: ResumeCard) {
    try {
      const res = await apiFetch<{ resume: ResumeCard }>(
        `/api/resumes/${r.id}/duplicate`,
        { method: "POST" },
      );
      setResumes((prev) => [res.resume, ...prev]);
      toast.success("Resume duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not duplicate");
    }
  }

  async function download(r: ResumeCard) {
    toast.loading("Preparing PDF…", { id: "pdf" });
    try {
      const res = await fetch(`/api/resumes/${r.id}/pdf`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded", { id: "pdf" });
    } catch {
      toast.error("Could not generate PDF", { id: "pdf" });
    }
  }

  async function confirmRename() {
    if (!renaming || !renameValue.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/api/resumes/${renaming.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: renameValue }),
      });
      setResumes((prev) =>
        prev.map((x) => (x.id === renaming.id ? { ...x, name: renameValue } : x)),
      );
      toast.success("Renamed");
      setRenaming(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/resumes/${deleting.id}`, { method: "DELETE" });
      setResumes((prev) => prev.filter((x) => x.id !== deleting.id));
      toast.success("Resume deleted");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (resumes.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileStack className="size-6" />
        </span>
        <p className="text-muted-foreground">You don&apos;t have any resumes yet.</p>
        <Link href="/dashboard/resumes/new" className={buttonVariants({ variant: "gradient" })}>
          <Plus className="size-4" /> Create your first resume
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumes.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileStack className="size-5" />
              </span>
              <div className="flex gap-1">
                <Badge variant="muted" className="capitalize">{r.template}</Badge>
                {r.atsScore != null && <Badge variant="success">ATS {r.atsScore}</Badge>}
              </div>
            </div>
            <Link href={`/dashboard/resumes/${r.id}`} className="mt-3 font-semibold hover:text-primary">
              {r.name}
            </Link>
            <div className="mt-1 text-xs text-muted-foreground">
              Updated {formatDate(r.updatedAt)} · Created {formatDate(r.createdAt)}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Link
                href={`/dashboard/resumes/${r.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Pencil className="size-3.5" /> Edit
              </Link>
              <Button variant="ghost" size="sm" onClick={() => duplicate(r)} title="Duplicate">
                <Copy className="size-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => download(r)} title="Download PDF">
                <Download className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRenaming(r);
                  setRenameValue(r.name);
                }}
                title="Rename"
              >
                <Type className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(r)}
                title="Delete"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        title="Rename resume"
      >
        <div className="space-y-4">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button variant="gradient" onClick={confirmRename} loading={busy}>Save</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete resume?"
        description={`"${deleting?.name}" will be permanently deleted. This cannot be undone.`}
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
