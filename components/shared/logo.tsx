import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <span className="text-lg tracking-tight">CareerAI</span>
    </Link>
  );
}
