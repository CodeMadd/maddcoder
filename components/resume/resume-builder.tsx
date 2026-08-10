"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  Gauge,
  Target,
  Check,
  Loader2,
  LayoutTemplate,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Languages as LangIcon,
  Trophy,
  MessageSquareText,
} from "lucide-react";

import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  RESUME_TEMPLATES,
  type ResumeContent,
  type ResumeTemplate,
} from "@/lib/validation/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChipsInput } from "@/components/resume/chips-input";
import { ResumePreview } from "@/components/resume/resume-preview";
import { AIResultDialog } from "@/components/resume/ai-result-dialog";
import type { ResumeAnalysis, JobMatch } from "@/lib/ai/services/resume-ai";

type Props = {
  id: string;
  initialName: string;
  initialTemplate: ResumeTemplate;
  initialContent: ResumeContent;
};

const SECTIONS = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "summary", label: "Summary", icon: FileText },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "certifications", label: "Certifications", icon: Award },
  { key: "languages", label: "Languages", icon: LangIcon },
  { key: "achievements", label: "Achievements", icon: Trophy },
  { key: "assistant", label: "AI Assistant", icon: MessageSquareText },
  { key: "analyze", label: "Analyze (ATS)", icon: Gauge },
  { key: "match", label: "Match to Job", icon: Target },
  { key: "template", label: "Template", icon: LayoutTemplate },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ResumeBuilder({
  id,
  initialName,
  initialTemplate,
  initialContent,
}: Props) {
  const [name, setName] = useState(initialName);
  const [template, setTemplate] = useState<ResumeTemplate>(initialTemplate);
  const [content, setContentState] = useState<ResumeContent>(initialContent);
  const [active, setActive] = useState<SectionKey>("personal");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const [downloading, setDownloading] = useState(false);
  const firstRender = useRef(true);

  const setContent = useCallback(
    (updater: (draft: ResumeContent) => void) => {
      setContentState((prev) => {
        const next = structuredClone(prev);
        updater(next);
        return next;
      });
    },
    [],
  );

  // Debounced autosave.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await apiFetch(`/api/resumes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, template, content }),
        });
        setSaveState("saved");
      } catch (err) {
        setSaveState("idle");
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [id, name, template, content]);

  // ---- AI dialog plumbing -------------------------------------------------
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiValue, setAiValue] = useState("");
  const [aiTitle, setAiTitle] = useState("AI suggestion");
  const [aiApplyLabel, setAiApplyLabel] = useState("Apply");
  const aiGen = useRef<() => Promise<string>>(async () => "");
  const aiApply = useRef<(v: string) => void>(() => {});

  async function callAI<T>(body: Record<string, unknown>): Promise<T> {
    const res = await apiFetch<{ result: T }>(`/api/resumes/${id}/ai`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.result;
  }

  async function openAi(opts: {
    title: string;
    applyLabel?: string;
    generate: () => Promise<string>;
    apply: (v: string) => void;
  }) {
    setAiTitle(opts.title);
    setAiApplyLabel(opts.applyLabel ?? "Apply");
    aiGen.current = opts.generate;
    aiApply.current = opts.apply;
    setAiOpen(true);
    setAiLoading(true);
    try {
      setAiValue(await opts.generate());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function regenerate() {
    setAiLoading(true);
    try {
      setAiValue(await aiGen.current());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAi() {
    aiApply.current(aiValue);
    setAiOpen(false);
    toast.success("Applied");
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      // Ensure latest state is persisted before rendering server-side.
      await apiFetch(`/api/resumes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, template, content }),
      });
      const res = await fetch(`/api/resumes/${id}/pdf`);
      if (!res.ok) throw new Error("Could not generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3">
        <Link
          href="/dashboard/resumes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Resumes
        </Link>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 max-w-xs font-medium"
          aria-label="Resume name"
        />
        <span className="text-xs text-muted-foreground">
          {saveState === "saving" ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> Saving…
            </span>
          ) : saveState === "saved" ? (
            <span className="flex items-center gap-1 text-success">
              <Check className="size-3" /> Saved
            </span>
          ) : (
            "Unsaved"
          )}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border p-0.5 lg:hidden">
          {(["editor", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize",
                mobileTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_1fr]">
        {/* Editor */}
        <div
          className={cn(
            "flex min-h-0 flex-col border-r lg:flex",
            mobileTab === "preview" && "hidden lg:flex",
          )}
        >
          <div className="flex gap-1 overflow-x-auto border-b bg-muted/20 p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active === s.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <s.icon className="size-3.5" />
                {s.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-5">
            {renderSection()}
          </div>
        </div>

        {/* Preview */}
        <div
          className={cn(
            "min-h-0 bg-slate-100 lg:block",
            mobileTab === "editor" && "hidden lg:block",
          )}
        >
          <ResumePreview
            content={content}
            template={template}
            onDownload={downloadPdf}
            downloading={downloading}
          />
        </div>
      </div>

      <AIResultDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        title={aiTitle}
        loading={aiLoading}
        value={aiValue}
        onValueChange={setAiValue}
        onRegenerate={regenerate}
        onApply={applyAi}
        applyLabel={aiApplyLabel}
      />
    </div>
  );

  function renderSection() {
    switch (active) {
      case "personal":
        return <PersonalSection content={content} setContent={setContent} />;
      case "summary":
        return renderSummary();
      case "experience":
        return renderExperience();
      case "education":
        return renderEducation();
      case "skills":
        return renderSkills();
      case "projects":
        return renderProjects();
      case "certifications":
        return renderCertifications();
      case "languages":
        return renderLanguages();
      case "achievements":
        return renderAchievements();
      case "assistant":
        return renderAssistant();
      case "analyze":
        return <AnalyzePanel resumeId={id} />;
      case "match":
        return <MatchPanel resumeId={id} />;
      case "template":
        return renderTemplate();
    }
  }

  function renderSummary() {
    const s = content.summary;
    return (
      <SectionShell title="Professional Summary" description="A concise pitch at the top of your resume.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Years of Experience">
            <Input
              value={s.yearsOfExperience}
              onChange={(e) => setContent((d) => (d.summary.yearsOfExperience = e.target.value))}
              placeholder="5"
            />
          </Field>
          <Field label="Target Job Title">
            <Input
              value={s.targetJobTitle}
              onChange={(e) => setContent((d) => (d.summary.targetJobTitle = e.target.value))}
              placeholder="Senior Frontend Developer"
            />
          </Field>
          <Field label="Industry">
            <Input
              value={s.industry}
              onChange={(e) => setContent((d) => (d.summary.industry = e.target.value))}
              placeholder="SaaS"
            />
          </Field>
        </div>
        <Field label="Professional Summary">
          <Textarea
            value={s.text}
            onChange={(e) => setContent((d) => (d.summary.text = e.target.value))}
            className="min-h-[120px]"
            placeholder="Write a short summary or generate one with AI."
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Generate with AI", variant: "generate" },
            { label: "Regenerate", variant: "generate" },
            { label: "Shorten", variant: "shorten" },
            { label: "Make More Professional", variant: "professional" },
            { label: "Make More Impactful", variant: "impactful" },
          ].map((b) => (
            <Button
              key={b.label}
              size="sm"
              variant={b.label === "Generate with AI" ? "gradient" : "outline"}
              onClick={() =>
                openAi({
                  title: "Professional summary",
                  generate: async () => {
                    const r = await callAI<{ text: string }>({
                      action: "summary",
                      variant: b.variant,
                      content,
                    });
                    return r.text;
                  },
                  apply: (v) => setContent((d) => (d.summary.text = v)),
                })
              }
            >
              <Sparkles className="size-3.5" /> {b.label}
            </Button>
          ))}
        </div>
      </SectionShell>
    );
  }

  function renderExperience() {
    return (
      <SectionShell
        title="Work Experience"
        description="List roles from most to least recent."
        onAdd={() =>
          setContent((d) =>
            d.experiences.push({
              id: uid(),
              company: "",
              jobTitle: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
              achievements: [],
            }),
          )
        }
        addLabel="Add Experience"
      >
        {content.experiences.length === 0 && <EmptyHint text="No experience yet." />}
        {content.experiences.map((exp, i) => (
          <EntryCard
            key={exp.id}
            onRemove={() => setContent((d) => d.experiences.splice(i, 1))}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Job Title">
                <Input value={exp.jobTitle} onChange={(e) => setContent((d) => (d.experiences[i].jobTitle = e.target.value))} />
              </Field>
              <Field label="Company">
                <Input value={exp.company} onChange={(e) => setContent((d) => (d.experiences[i].company = e.target.value))} />
              </Field>
              <Field label="Location">
                <Input value={exp.location} onChange={(e) => setContent((d) => (d.experiences[i].location = e.target.value))} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start">
                  <Input value={exp.startDate} onChange={(e) => setContent((d) => (d.experiences[i].startDate = e.target.value))} placeholder="Jan 2022" />
                </Field>
                <Field label="End">
                  <Input value={exp.endDate} disabled={exp.current} onChange={(e) => setContent((d) => (d.experiences[i].endDate = e.target.value))} placeholder="Present" />
                </Field>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => setContent((d) => (d.experiences[i].current = e.target.checked))}
                className="size-4 rounded border-input"
              />
              I currently work here
            </label>
            <Field label="Description">
              <Textarea value={exp.description} onChange={(e) => setContent((d) => (d.experiences[i].description = e.target.value))} placeholder="Worked on..." />
            </Field>
            {exp.achievements.length > 0 && (
              <div className="rounded-lg bg-muted/40 p-2 text-sm">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Achievements</div>
                <ul className="list-disc space-y-1 pl-5">
                  {exp.achievements.map((a, ai) => (
                    <li key={ai}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openAi({
                    title: "Improve description",
                    generate: async () => {
                      const r = await callAI<{ description: string; bullets: string[] }>({
                        action: "improve_experience",
                        section: exp,
                      });
                      return r.description || (r.bullets ?? []).join("\n");
                    },
                    apply: (v) => setContent((d) => (d.experiences[i].description = v)),
                  })
                }
              >
                <Wand2 className="size-3.5" /> AI Improve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openAi({
                    title: "Generate bullet points",
                    applyLabel: "Add as achievements",
                    generate: async () => {
                      const r = await callAI<{ bullets: string[] }>({
                        action: "generate_bullets",
                        section: exp,
                      });
                      return (r.bullets ?? []).join("\n");
                    },
                    apply: (v) =>
                      setContent((d) => {
                        d.experiences[i].achievements = v
                          .split("\n")
                          .map((x) => x.replace(/^[-•*]\s*/, "").trim())
                          .filter(Boolean);
                      }),
                  })
                }
              >
                <Sparkles className="size-3.5" /> Generate Bullet Points
              </Button>
            </div>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderEducation() {
    return (
      <SectionShell
        title="Education"
        onAdd={() =>
          setContent((d) =>
            d.education.push({
              id: uid(),
              institution: "",
              degree: "",
              field: "",
              startDate: "",
              endDate: "",
              gpa: "",
              description: "",
            }),
          )
        }
        addLabel="Add Education"
      >
        {content.education.length === 0 && <EmptyHint text="No education yet." />}
        {content.education.map((ed, i) => (
          <EntryCard key={ed.id} onRemove={() => setContent((d) => d.education.splice(i, 1))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution">
                <Input value={ed.institution} onChange={(e) => setContent((d) => (d.education[i].institution = e.target.value))} />
              </Field>
              <Field label="Degree">
                <Input value={ed.degree} onChange={(e) => setContent((d) => (d.education[i].degree = e.target.value))} />
              </Field>
              <Field label="Field of Study">
                <Input value={ed.field} onChange={(e) => setContent((d) => (d.education[i].field = e.target.value))} />
              </Field>
              <Field label="GPA">
                <Input value={ed.gpa} onChange={(e) => setContent((d) => (d.education[i].gpa = e.target.value))} />
              </Field>
              <Field label="Start">
                <Input value={ed.startDate} onChange={(e) => setContent((d) => (d.education[i].startDate = e.target.value))} />
              </Field>
              <Field label="End">
                <Input value={ed.endDate} onChange={(e) => setContent((d) => (d.education[i].endDate = e.target.value))} />
              </Field>
            </div>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderSkills() {
    const s = content.skills;
    return (
      <SectionShell title="Skills" description="Add skills as tags. Suggestions are drawn from your experience.">
        <ChipsInput label="Technical Skills" value={s.technical} onChange={(v) => setContent((d) => (d.skills.technical = v))} />
        <ChipsInput label="Frameworks" value={s.frameworks} onChange={(v) => setContent((d) => (d.skills.frameworks = v))} />
        <ChipsInput label="Tools" value={s.tools} onChange={(v) => setContent((d) => (d.skills.tools = v))} />
        <ChipsInput label="Soft Skills" value={s.soft} onChange={(v) => setContent((d) => (d.skills.soft = v))} />
        <ChipsInput label="Languages" value={s.languages} onChange={(v) => setContent((d) => (d.skills.languages = v))} />
        <SuggestSkills resumeId={id} content={content} onAdd={(skill) => setContent((d) => { if (!d.skills.technical.includes(skill)) d.skills.technical.push(skill); })} />
      </SectionShell>
    );
  }

  function renderProjects() {
    return (
      <SectionShell
        title="Projects"
        onAdd={() =>
          setContent((d) =>
            d.projects.push({ id: uid(), name: "", description: "", technologies: [], url: "", githubUrl: "", startDate: "", endDate: "" }),
          )
        }
        addLabel="Add Project"
      >
        {content.projects.length === 0 && <EmptyHint text="No projects yet." />}
        {content.projects.map((pr, i) => (
          <EntryCard key={pr.id} onRemove={() => setContent((d) => d.projects.splice(i, 1))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Project Name">
                <Input value={pr.name} onChange={(e) => setContent((d) => (d.projects[i].name = e.target.value))} />
              </Field>
              <Field label="Project URL">
                <Input value={pr.url} onChange={(e) => setContent((d) => (d.projects[i].url = e.target.value))} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={pr.description} onChange={(e) => setContent((d) => (d.projects[i].description = e.target.value))} />
            </Field>
            <ChipsInput label="Technologies" value={pr.technologies} onChange={(v) => setContent((d) => (d.projects[i].technologies = v))} />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openAi({
                  title: "Improve project description",
                  generate: async () => {
                    const r = await callAI<{ description: string }>({ action: "improve_project", section: pr });
                    return r.description;
                  },
                  apply: (v) => setContent((d) => (d.projects[i].description = v)),
                })
              }
            >
              <Wand2 className="size-3.5" /> Improve Project Description
            </Button>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderCertifications() {
    return (
      <SectionShell
        title="Certifications"
        onAdd={() =>
          setContent((d) =>
            d.certifications.push({ id: uid(), name: "", organization: "", issueDate: "", expirationDate: "", credentialId: "", credentialUrl: "" }),
          )
        }
        addLabel="Add Certification"
      >
        {content.certifications.length === 0 && <EmptyHint text="No certifications yet." />}
        {content.certifications.map((c, i) => (
          <EntryCard key={c.id} onRemove={() => setContent((d) => d.certifications.splice(i, 1))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={c.name} onChange={(e) => setContent((d) => (d.certifications[i].name = e.target.value))} />
              </Field>
              <Field label="Issuing Organization">
                <Input value={c.organization} onChange={(e) => setContent((d) => (d.certifications[i].organization = e.target.value))} />
              </Field>
              <Field label="Issue Date">
                <Input value={c.issueDate} onChange={(e) => setContent((d) => (d.certifications[i].issueDate = e.target.value))} />
              </Field>
              <Field label="Expiration Date">
                <Input value={c.expirationDate} onChange={(e) => setContent((d) => (d.certifications[i].expirationDate = e.target.value))} />
              </Field>
            </div>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderLanguages() {
    return (
      <SectionShell
        title="Languages"
        onAdd={() => setContent((d) => d.languages.push({ id: uid(), language: "", proficiency: "" }))}
        addLabel="Add Language"
      >
        {content.languages.length === 0 && <EmptyHint text="No languages yet." />}
        {content.languages.map((l, i) => (
          <EntryCard key={l.id} onRemove={() => setContent((d) => d.languages.splice(i, 1))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Language">
                <Input value={l.language} onChange={(e) => setContent((d) => (d.languages[i].language = e.target.value))} placeholder="English" />
              </Field>
              <Field label="Proficiency">
                <Input value={l.proficiency} onChange={(e) => setContent((d) => (d.languages[i].proficiency = e.target.value))} placeholder="Fluent" />
              </Field>
            </div>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderAchievements() {
    return (
      <SectionShell
        title="Achievements"
        onAdd={() => setContent((d) => d.achievements.push({ id: uid(), title: "", description: "", date: "" }))}
        addLabel="Add Achievement"
      >
        {content.achievements.length === 0 && <EmptyHint text="No achievements yet." />}
        {content.achievements.map((a, i) => (
          <EntryCard key={a.id} onRemove={() => setContent((d) => d.achievements.splice(i, 1))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <Input value={a.title} onChange={(e) => setContent((d) => (d.achievements[i].title = e.target.value))} />
              </Field>
              <Field label="Date">
                <Input value={a.date} onChange={(e) => setContent((d) => (d.achievements[i].date = e.target.value))} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={a.description} onChange={(e) => setContent((d) => (d.achievements[i].description = e.target.value))} />
            </Field>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openAi({
                  title: "Improve achievement",
                  generate: async () => {
                    const r = await callAI<{ result: string }>({ action: "improve_achievement", section: a });
                    return r.result;
                  },
                  apply: (v) => setContent((d) => (d.achievements[i].description = v)),
                })
              }
            >
              <Sparkles className="size-3.5" /> Improve with AI
            </Button>
          </EntryCard>
        ))}
      </SectionShell>
    );
  }

  function renderAssistant() {
    const commands = [
      "Make this more concise",
      "Make this ATS-friendly",
      "Fix grammar",
      "Suggest keywords",
      "Rewrite professionally",
    ];
    return (
      <SectionShell
        title="AI Assistant"
        description="Runs on your professional summary. Review results before applying — nothing is overwritten silently."
      >
        <Textarea
          value={content.summary.text}
          onChange={(e) => setContent((d) => (d.summary.text = e.target.value))}
          className="min-h-[120px]"
          placeholder="Your summary text..."
        />
        <div className="flex flex-wrap gap-2">
          {commands.map((cmd) => (
            <Button
              key={cmd}
              size="sm"
              variant="outline"
              onClick={() =>
                openAi({
                  title: cmd,
                  generate: async () => {
                    const r = await callAI<{ result: string }>({
                      action: "assistant",
                      command: cmd,
                      text: content.summary.text,
                    });
                    return r.result;
                  },
                  apply: (v) => setContent((d) => (d.summary.text = v)),
                })
              }
            >
              <Sparkles className="size-3.5" /> {cmd}
            </Button>
          ))}
        </div>
      </SectionShell>
    );
  }

  function renderTemplate() {
    return (
      <SectionShell title="Template" description="Switch templates anytime — your content is preserved.">
        <div className="grid gap-3 sm:grid-cols-2">
          {RESUME_TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={cn(
                "rounded-xl border-2 p-4 text-left capitalize transition-colors",
                template === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t}</span>
                {template === t && <Check className="size-4 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t === "minimal" && "Clean serif, no color."}
                {t === "modern" && "Indigo accent, sans-serif."}
                {t === "professional" && "Navy uppercase headings."}
                {t === "executive" && "Centered, elegant serif."}
                {t === "technical" && "Monospace accents, chips."}
              </p>
            </button>
          ))}
        </div>
      </SectionShell>
    );
  }
}

// ---------------------------------------------------------------------------
// Presentational + panel helpers
// ---------------------------------------------------------------------------

function SectionShell({
  title,
  description,
  children,
  onAdd,
  addLabel,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {onAdd && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="size-4" /> {addLabel ?? "Add"}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative space-y-3 rounded-xl border bg-card p-4">
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove entry"
      >
        <Trash2 className="size-4" />
      </button>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PersonalSection({
  content,
  setContent,
}: {
  content: ResumeContent;
  setContent: (u: (d: ResumeContent) => void) => void;
}) {
  const p = content.personalInfo;
  const fields: { key: keyof typeof p; label: string; placeholder?: string }[] = [
    { key: "fullName", label: "Full Name" },
    { key: "title", label: "Professional Title" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
    { key: "website", label: "Website" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
  ];
  return (
    <SectionShell title="Personal Information" description="Only what's needed to reach you.">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              value={p[f.key]}
              onChange={(e) => setContent((d) => ((d.personalInfo[f.key] as string) = e.target.value))}
              placeholder={f.placeholder}
            />
          </Field>
        ))}
      </div>
    </SectionShell>
  );
}

function SuggestSkills({
  resumeId,
  content,
  onAdd,
}: {
  resumeId: string;
  content: ResumeContent;
  onAdd: (skill: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function run() {
    setLoading(true);
    try {
      const res = await apiFetch<{ result: { skills: string[] } }>(
        `/api/resumes/${resumeId}/ai`,
        { method: "POST", body: JSON.stringify({ action: "suggest_skills", content }) },
      );
      setSuggestions(res.result.skills);
      if (res.result.skills.length === 0) toast.info("No new skills found in your experience yet.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <Button size="sm" variant="gradient" onClick={run} loading={loading}>
        <Sparkles className="size-3.5" /> Suggest Skills
      </Button>
      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                onAdd(s);
                setSuggestions((prev) => prev.filter((x) => x !== s));
              }}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background px-2.5 py-1 text-xs text-primary hover:bg-primary/10"
            >
              <Plus className="size-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyzePanel({ resumeId }: { resumeId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await apiFetch<{ result: ResumeAnalysis }>(
        `/api/resumes/${resumeId}/analyze`,
        { method: "POST" },
      );
      setResult(res.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="ATS Analysis" description="An AI-based estimate — not a real ATS score.">
      <Button variant="gradient" onClick={run} loading={loading}>
        <Gauge className="size-4" /> Analyze Resume
      </Button>
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <div className="text-sm text-muted-foreground">ATS Compatibility</div>
            <div className="text-4xl font-bold text-primary">{result.overall}/100</div>
          </div>
          <div className="space-y-3">
            {Object.entries(result.breakdown).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
                <Progress value={v} />
              </div>
            ))}
          </div>
          {result.issues.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Issues</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.issues.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          {result.suggestions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Suggestions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.suggestions.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
        </div>
      )}
    </SectionShell>
  );
}

function MatchPanel({ resumeId }: { resumeId: string }) {
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<JobMatch | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await apiFetch<{ result: JobMatch }>(
        `/api/resumes/${resumeId}/match`,
        { method: "POST", body: JSON.stringify({ jobDescription: jd }) },
      );
      setResult(res.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Match Resume to Job" description="Paste a job description to compare.">
      <Textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the job description here..."
        className="min-h-[140px]"
      />
      <Button variant="gradient" onClick={run} loading={loading} disabled={jd.trim().length < 20}>
        <Target className="size-4" /> Match Resume to Job
      </Button>
      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-semibold text-success">Matching Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {result.matching.length ? result.matching.map((s) => (
                <Badge key={s} variant="success">{s}</Badge>
              )) : <span className="text-sm text-muted-foreground">None detected.</span>}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-semibold text-warning">Missing Keywords</h3>
            <div className="flex flex-wrap gap-1.5">
              {result.missing.length ? result.missing.map((s) => (
                <Badge key={s} variant="warning">{s}</Badge>
              )) : <span className="text-sm text-muted-foreground">Great coverage!</span>}
            </div>
          </div>
          <div className="rounded-xl border p-4 sm:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Recommendations</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
