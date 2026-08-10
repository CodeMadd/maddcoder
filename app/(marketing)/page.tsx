import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Wand2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";

const RESUME_FEATURES = [
  "AI-generated professional summary",
  "AI-written experience descriptions",
  "Resume improvement & rewriting",
  "ATS optimization score",
  "5 professional templates",
  "One-click PDF export",
];

const DOC_FEATURES = [
  "PDF / DOCX / TXT support",
  "Quick, standard & detailed summaries",
  "Key points & important details",
  "AI-generated questions",
  "Chat with your document",
  "Copy or download results",
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl" />
        </div>
        <div className="container grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <Badge className="mb-5" variant="secondary">
              <Sparkles className="mr-1 size-3" /> Create. Improve. Understand.
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Build Better Resumes.{" "}
              <span className="gradient-text">Understand Documents Faster.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              AI-powered tools to create professional resumes and instantly
              summarize lengthy documents.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?next=/dashboard/resumes"
                className={buttonVariants({ variant: "gradient", size: "lg" })}
              >
                Build My Resume <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register?next=/dashboard/documents"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Summarize a Document
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-success" /> Private & secure
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-4 text-warning" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" /> ATS-friendly
              </span>
            </div>
          </div>
          <Reveal delay={0.1}>
            <DashboardMockup />
          </Reveal>
        </div>
      </section>

      {/* Feature tools */}
      <section id="features" className="border-t bg-muted/20 py-20">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Two powerful AI tools in one place
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to land the interview and stay on top of your
              reading.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <Reveal>
              <ToolCard
                icon={<Wand2 className="size-6" />}
                title="AI Resume Builder"
                description="Create a professional, ATS-friendly resume with AI-powered writing assistance."
                features={RESUME_FEATURES}
                href="/resume-builder"
                cta="Explore the builder"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <ToolCard
                icon={<FileText className="size-6" />}
                title="AI Document Summarizer"
                description="Upload a document and instantly extract its most important information."
                features={DOC_FEATURES}
                href="/document-summarizer"
                cta="Explore the summarizer"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-secondary px-8 py-16 text-center text-white shadow-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to accelerate your career?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              Join CareerAI and create your first AI-powered resume in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className={buttonVariants({ size: "lg", className: "bg-white text-primary hover:bg-white/90" })}
              >
                Get started free <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ToolCard({
  icon,
  title,
  description,
  features,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {cta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
