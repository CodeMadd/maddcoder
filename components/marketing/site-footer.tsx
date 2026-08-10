import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Create. Improve. Understand. AI tools for resumes and documents.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/resume-builder" className="hover:text-foreground">
            Resume Builder
          </Link>
          <Link href="/document-summarizer" className="hover:text-foreground">
            Summarizer
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </nav>
      </div>
      <div className="border-t py-4">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CareerAI. Built as a full-stack demo.
        </p>
      </div>
    </footer>
  );
}
