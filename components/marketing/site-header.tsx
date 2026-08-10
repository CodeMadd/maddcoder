import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/resume-builder", label: "Resume Builder" },
  { href: "/document-summarizer", label: "Summarizer" },
  { href: "/pricing", label: "Pricing" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "gradient", size: "sm" })}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "gradient", size: "sm" })}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
