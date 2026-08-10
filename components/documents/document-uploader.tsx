"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, FileText, Loader2, ClipboardPaste } from "lucide-react";

import { apiFetch } from "@/lib/client";
import { formatBytes, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const ACCEPT = ".pdf,.docx,.txt";
const MAX_MB = 10;

export function DocumentUploader() {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Paste form
  const [pasteName, setPasteName] = useState("Pasted text");
  const [pasteText, setPasteText] = useState("");
  const [pasting, setPasting] = useState(false);

  const validate = useCallback((f: File): string | null => {
    const okExt = /\.(pdf|docx|txt)$/i.test(f.name);
    if (!okExt) return "Unsupported file type. Use PDF, DOCX, or TXT.";
    if (f.size === 0) return "That file is empty.";
    if (f.size > MAX_MB * 1024 * 1024) return `File too large (max ${MAX_MB} MB on Free).`;
    return null;
  }, []);

  function pick(f: File | undefined | null) {
    if (!f) return;
    const err = validate(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
  }

  function uploadFile() {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onloadstart = () => setProgress(1);
    xhr.upload.onload = () => setStatus("processing");
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success("Document processed");
          router.push(`/dashboard/documents/${body.document.id}`);
        } else {
          setStatus("idle");
          toast.error(body.error || "Upload failed");
        }
      } catch {
        setStatus("idle");
        toast.error("Upload failed");
      }
    };
    xhr.onerror = () => {
      setStatus("idle");
      toast.error("Network error during upload");
    };
    xhr.send(form);
  }

  async function submitPaste() {
    if (pasteText.trim().length < 1) {
      toast.error("Paste some text first.");
      return;
    }
    setPasting(true);
    try {
      const res = await apiFetch<{ document: { id: string } }>(
        "/api/documents/paste",
        { method: "POST", body: JSON.stringify({ filename: pasteName, text: pasteText }) },
      );
      toast.success("Text saved");
      router.push(`/dashboard/documents/${res.document.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save text");
      setPasting(false);
    }
  }

  const uploading = status !== "idle";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex gap-1 rounded-lg border p-1">
        {(["upload", "paste"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t === "upload" ? <UploadCloud className="size-4" /> : <ClipboardPaste className="size-4" />}
            {t === "upload" ? "Upload file" : "Paste text"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-6" />
            </span>
            <div>
              <div className="font-medium">Drag &amp; drop your document</div>
              <div className="text-sm text-muted-foreground">or click to browse</div>
            </div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, TXT · up to {MAX_MB} MB</div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>

          {file && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {file.name.split(".").pop()?.toUpperCase()}
                  </div>
                </div>
              </div>
              {uploading && (
                <div className="mt-3">
                  <Progress value={status === "processing" ? 100 : progress} />
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {status === "processing" ? "Extracting text…" : `Uploading ${progress}%`}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full"
            onClick={uploadFile}
            disabled={!file}
            loading={uploading}
          >
            {status === "processing" ? "Processing…" : "Upload & process"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pn">Title</Label>
            <Input id="pn" value={pasteName} onChange={(e) => setPasteName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt">Text</Label>
            <Textarea
              id="pt"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the document text you want to summarize…"
              className="min-h-[220px]"
            />
          </div>
          <Button variant="gradient" className="w-full" onClick={submitPaste} loading={pasting}>
            Save &amp; continue
          </Button>
        </div>
      )}
    </div>
  );
}
