import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI Resume Builder",
  description:
    "Create a professional, ATS-friendly resume with AI-powered writing assistance, live preview, 5 templates, and PDF export.",
};

const POINTS = [
  "Multi-step editor with a real-time live preview",
  "AI professional summary, experience rewriting, and bullet generation",
  "ATS compatibility score and job-description matching",
  "Five ATS-friendly, print-ready templates",
  "One-click PDF export that preserves your template",
];

export default function ResumeBuilderMarketing() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The <span className="gradient-text">AI Resume Builder</span> that gets
          you interviews
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Create a professional, ATS-friendly resume with AI-powered writing
          assistance — without staring at a blank page.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register?next=/dashboard/resumes"
            className={buttonVariants({ variant: "gradient", size: "lg" })}
          >
            Build my resume <ArrowRight className="size-4" />
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
