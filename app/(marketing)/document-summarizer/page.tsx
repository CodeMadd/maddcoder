import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI Document Summarizer",
  description:
    "Upload a PDF, DOCX, or TXT and instantly extract summaries, key points, important details, and chat with your document.",
};

const POINTS = [
  "Upload PDF, DOCX, TXT — or paste text directly",
  "Quick, standard, and detailed summary modes",
  "Key points and important details (dates, numbers, deadlines)",
  "Ask questions and chat with your document",
  "Copy or download your summary as TXT or PDF",
];

export default function DocumentSummarizerMarketing() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Understand any document in{" "}
          <span className="gradient-text">seconds</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Upload a document and instantly extract its most important
          information — grounded in the source, never made up.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register?next=/dashboard/documents"
            className={buttonVariants({ variant: "gradient", size: "lg" })}
          >
            Summarize a document <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <ul className="mx-auto mt-14 grid max-w-2xl gap-4">
        {POINTS.map((p) => (
          <li
            key={p}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
