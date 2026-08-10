import type { Metadata } from "next";
import {
  Wand2,
  FileText,
  Gauge,
  Target,
  LayoutTemplate,
  Download,
  MessageSquare,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore CareerAI features: AI resume writing, ATS analysis, job matching, document summarization, and document chat.",
};

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Resume Writing",
    body: "Generate summaries, rewrite experience into strong bullet points, and improve any section on demand.",
  },
  {
    icon: Gauge,
    title: "ATS Analysis",
    body: "Get an AI-based ATS compatibility estimate with a per-category breakdown and actionable fixes.",
  },
  {
    icon: Target,
    title: "Job Description Matching",
    body: "Paste a job description to see matching skills, missing keywords, and tailored recommendations.",
  },
  {
    icon: LayoutTemplate,
    title: "5 Professional Templates",
    body: "Minimal, Modern, Professional, Executive, and Technical — all ATS- and print-friendly.",
  },
  {
    icon: Download,
    title: "PDF Export",
    body: "Download a pixel-accurate PDF that preserves your selected template and formatting.",
  },
  {
    icon: FileText,
    title: "Document Summarizer",
    body: "Upload PDF, DOCX, or TXT and get executive summaries, key points, and important details.",
  },
  {
    icon: MessageSquare,
    title: "Chat With Documents",
    body: "Ask questions and get answers grounded in your document with source-aware retrieval.",
  },
  {
    icon: ListChecks,
    title: "Usage Tracking",
    body: "Transparent AI usage limits per plan with friendly upgrade prompts when you hit them.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    body: "Private storage, server-side ownership checks, and minimal logging of your content.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 flex justify-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Everything you need, powered by AI
        </h1>
        <p className="mt-4 text-muted-foreground">
          A complete toolkit for building resumes and understanding documents.
        </p>
      </div>
      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
