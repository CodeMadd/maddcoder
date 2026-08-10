"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Send,
  Loader2,
  ListChecks,
  Info,
  MessageSquareText,
  HelpCircle,
} from "lucide-react";

import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { SUMMARY_MODES, type SummaryMode } from "@/lib/validation/document";
import type { DocumentSummary } from "@/lib/ai/services/document-ai";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type ChatMessage = { id: string; role: "USER" | "ASSISTANT"; content: string };

export function DocumentWorkspace({
  id,
  status,
  initialSummary,
  initialMessages,
}: {
  id: string;
  filename: string;
  status: string;
  initialSummary: DocumentSummary | null;
  initialMessages: ChatMessage[];
}) {
  const [mode, setMode] = useState<SummaryMode>("standard");
  const [summary, setSummary] = useState<DocumentSummary | null>(initialSummary);
  const [generating, setGenerating] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function generate() {
    setGenerating(true);
    try {
      const res = await apiFetch<{ summary: DocumentSummary }>(
        `/api/documents/${id}/summarize`,
        { method: "POST", body: JSON.stringify({ mode }) },
      );
      setSummary(res.summary);
      toast.success("Summary generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setGenerating(false);
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || sending) return;
    setInput("");
    const optimistic: ChatMessage = { id: `tmp-${Date.now()}`, role: "USER", content: q };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await apiFetch<{ message: ChatMessage }>(
        `/api/documents/${id}/chat`,
        { method: "POST", body: JSON.stringify({ message: q }) },
      );
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function copySummary() {
    if (!summary) return;
    const d = summary.importantDetails;
    const text = [
      `Executive Summary\n${summary.executiveSummary}`,
      `\nKey Points\n${summary.keyPoints.map((k) => `• ${k}`).join("\n")}`,
      d.dates.length ? `\nDates: ${d.dates.join(", ")}` : "",
      d.numbers.length ? `Numbers: ${d.numbers.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Summary copied");
  }

  const details = summary?.importantDetails;
  const hasDetails =
    details &&
    (details.names.length ||
      details.dates.length ||
      details.numbers.length ||
      details.deadlines.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Summary column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Length:</span>
              {SUMMARY_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                    mode === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {m}
                </button>
              ))}
              <Button
                size="sm"
                variant="gradient"
                className="ml-auto"
                onClick={generate}
                loading={generating}
              >
                {summary ? "Summarize Again" : "Generate Summary"}
              </Button>
            </div>

            {generating ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : summary ? (
              <div className="space-y-5">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Executive Summary</h3>
                  <p className="text-sm text-muted-foreground">{summary.executiveSummary}</p>
                </div>
                <div>
                  <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                    <ListChecks className="size-4" /> Key Points
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {summary.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
                  </ul>
                </div>
                {hasDetails && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Info className="size-4" /> Important Details
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <DetailBlock label="Dates" items={details!.dates} />
                      <DetailBlock label="Numbers" items={details!.numbers} />
                      <DetailBlock label="Deadlines" items={details!.deadlines} />
                      <DetailBlock label="Names" items={details!.names} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{summary.disclaimer}</p>
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button size="sm" variant="outline" onClick={copySummary}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                  <a
                    href={`/api/documents/${id}/download?format=txt`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Download className="size-3.5" /> TXT
                  </a>
                  <a
                    href={`/api/documents/${id}/download?format=pdf`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Download className="size-3.5" /> PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 size-6" />
                {status === "READY"
                  ? "Choose a length and generate a summary."
                  : "This document is still processing."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat column */}
      <Card className="flex h-[600px] flex-col lg:sticky lg:top-24">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="size-4 text-primary" /> Document Assistant
          </CardTitle>
        </CardHeader>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask anything about this document. Answers are grounded in the text.
              </p>
              {(summary?.questions ?? [
                "What are the main conclusions?",
                "What deadlines are mentioned?",
                "What are the key requirements?",
              ]).map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-left text-sm hover:border-primary/40"
                >
                  <HelpCircle className="size-4 shrink-0 text-primary" /> {q}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "USER"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3.5 py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this document…"
            disabled={sending}
          />
          <Button type="submit" size="icon" variant="gradient" disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

function DetailBlock({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <Badge key={i} variant="muted" className="max-w-full truncate">{it}</Badge>
        ))}
      </div>
    </div>
  );
}
