import { FileText, LayoutDashboard, Sparkles, Wand2 } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="rounded-2xl border bg-card p-2 shadow-2xl ring-1 ring-black/5">
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-muted-foreground">
            careerai.app/dashboard
          </span>
        </div>
        <div className="grid grid-cols-[140px_1fr]">
          <aside className="hidden space-y-1 border-r bg-muted/20 p-3 sm:block">
            {[
              { icon: LayoutDashboard, label: "Overview", active: true },
              { icon: Wand2, label: "Resume Builder" },
              { icon: FileText, label: "Summarizer" },
            ].map((i) => (
              <div
                key={i.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                  i.active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <i.icon className="size-3.5" />
                {i.label}
              </div>
            ))}
          </aside>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "Resumes", v: "4" },
                { k: "Documents", v: "12" },
                { k: "AI Gens", v: "38" },
                { k: "Plan", v: "Pro" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border bg-card p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {s.k}
                  </div>
                  <div className="text-lg font-semibold">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> AI Suggestion
              </div>
              <div className="space-y-2">
                <div className="h-2 w-4/5 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
                <div className="h-2 w-3/5 rounded bg-muted" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-16 rounded bg-primary/90" />
                <div className="h-6 w-16 rounded border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
