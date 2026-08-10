"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

import { apiFetch } from "@/lib/client";
import { RESUME_TEMPLATES } from "@/lib/validation/resume";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function NewResumePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<string>("modern");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("Give your resume a name.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ resume: { id: string } }>("/api/resumes", {
        method: "POST",
        body: JSON.stringify({ name, template }),
      });
      toast.success("Resume created");
      router.push(`/dashboard/resumes/${res.resume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create resume");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create a new resume"
        description="Give it a name and pick a starting template. You can change everything later."
      />
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Resume name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Frontend Developer Resume"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RESUME_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-sm capitalize transition-colors",
                    template === t
                      ? "border-primary bg-primary/5 font-medium text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button variant="gradient" onClick={create} loading={loading} className="w-full">
            <Wand2 className="size-4" /> Create & open builder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
