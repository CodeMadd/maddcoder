"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Play, Sparkles, AlertCircle } from "lucide-react";

import { apiFetch } from "@/lib/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  "A pre-built resume you can edit, improve with AI, and export to PDF",
  "A sample document to summarize and chat with",
  "Full dashboard, templates, ATS analysis, and billing demo",
];

export function DemoLauncher() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const started = useRef(false);

  const launch = useCallback(async () => {
    setStatus("loading");
    try {
      // Make sure the shared demo account exists (safe on a fresh DB).
      await apiFetch("/api/demo", { method: "POST" });
      const res = await signIn("credentials", {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        redirect: false,
      });
      if (res?.error) throw new Error("Demo sign-in failed");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }, [router]);

  // Auto-launch on first visit for a true one-click experience.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    launch();
  }, [launch]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
          <Sparkles className="size-6" />
        </div>
        <CardTitle className="text-2xl">CareerAI Live Demo</CardTitle>
        <CardDescription>
          Explore the full app with a pre-loaded demo account — no signup needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {status === "error" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              Couldn&apos;t start the demo. Please try again.
            </div>
            <Button variant="gradient" className="w-full" onClick={launch}>
              <Play className="size-4" /> Retry
            </Button>
          </div>
        ) : (
          <Button
            variant="gradient"
            className="w-full"
            onClick={launch}
            loading={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Entering demo…
              </>
            ) : (
              <>
                <Play className="size-4" /> Enter the demo workspace
              </>
            )}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Prefer your own account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
