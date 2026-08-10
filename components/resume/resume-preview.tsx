"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Maximize2, Printer, Download, Loader2 } from "lucide-react";
import { getResumeHtml } from "@/lib/pdf/resume-html";
import type { ResumeContent, ResumeTemplate } from "@/lib/validation/resume";
import { Button } from "@/components/ui/button";

export function ResumePreview({
  content,
  template,
  onDownload,
  downloading,
}: {
  content: ResumeContent;
  template: ResumeTemplate;
  onDownload: () => void;
  downloading: boolean;
}) {
  const [zoom, setZoom] = useState(0.62);
  const html = useMemo(
    () => getResumeHtml(content, template),
    [content, template],
  );

  function openFullscreen() {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  function printResume() {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(0.62)}
          >
            Fit
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={openFullscreen} aria-label="Fullscreen">
            <Maximize2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={printResume} aria-label="Print">
            <Printer className="size-4" />
          </Button>
          <Button variant="gradient" size="sm" onClick={onDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-200/60 p-6">
        <div
          className="mx-auto origin-top bg-white shadow-lg"
          style={{
            width: "210mm",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          <iframe
            title="Resume preview"
            srcDoc={html}
            className="block h-[297mm] w-[210mm] border-0"
          />
        </div>
      </div>
    </div>
  );
}
