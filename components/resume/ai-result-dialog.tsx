"use client";

import { Sparkles, RefreshCw, Check, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AIResultDialog({
  open,
  onOpenChange,
  title = "AI suggestion",
  description = "Review the generated result before applying. Your content is never overwritten silently.",
  loading,
  value,
  onValueChange,
  onRegenerate,
  onApply,
  applyLabel = "Apply",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  loading: boolean;
  value: string;
  onValueChange: (v: string) => void;
  onRegenerate: () => void;
  onApply: () => void;
  applyLabel?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-xl"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm">Generating…</span>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Editable result
          </div>
          <Textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="min-h-[160px]"
          />
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={onRegenerate}>
              <RefreshCw className="size-4" /> Regenerate
            </Button>
            <Button variant="gradient" onClick={onApply} disabled={!value.trim()}>
              <Check className="size-4" /> {applyLabel}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
