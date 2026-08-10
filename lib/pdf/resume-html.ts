import type { ResumeContent, ResumeTemplate } from "@/lib/validation/resume";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateRange(start?: string, end?: string, current?: boolean): string {
  const e = current ? "Present" : esc(end);
  if (!start && !e) return "";
  return [esc(start), e].filter(Boolean).join(" – ");
}

function section(title: string, body: string): string {
  if (!body.trim()) return "";
  return `<section class="sec"><h2>${esc(title)}</h2>${body}</section>`;
}

function list(items: string[]): string {
  const filled = items.filter((i) => i && i.trim());
  if (!filled.length) return "";
  return `<ul>${filled.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function chips(items: string[]): string {
  const filled = items.filter((i) => i && i.trim());
  if (!filled.length) return "";
  return `<div class="chips">${filled
    .map((i) => `<span class="chip">${esc(i)}</span>`)
    .join("")}</div>`;
}

function renderBody(c: ResumeContent): string {
  const p = c.personalInfo;
  const contacts = [
    p.email,
    p.phone,
    p.location,
    p.website,
    p.linkedin,
    p.github,
  ]
    .filter(Boolean)
    .map((x) => `<span>${esc(x)}</span>`)
    .join('<span class="dot">•</span>');

  const header = `
    <header class="head">
      <h1>${esc(p.fullName) || "Your Name"}</h1>
      ${p.title ? `<div class="role">${esc(p.title)}</div>` : ""}
      ${contacts ? `<div class="contacts">${contacts}</div>` : ""}
    </header>`;

  const summary = c.summary.text
    ? section("Professional Summary", `<p>${esc(c.summary.text)}</p>`)
    : "";

  const experience = c.experiences.length
    ? section(
        "Experience",
        c.experiences
          .map(
            (e) => `
        <div class="item">
          <div class="item-head">
            <div><strong>${esc(e.jobTitle) || "Role"}</strong>${e.company ? ` — ${esc(e.company)}` : ""}</div>
            <div class="muted">${dateRange(e.startDate, e.endDate, e.current)}</div>
          </div>
          ${e.location ? `<div class="muted small">${esc(e.location)}</div>` : ""}
          ${e.description ? `<p>${esc(e.description)}</p>` : ""}
          ${list(e.achievements)}
        </div>`,
          )
          .join(""),
      )
    : "";

  const education = c.education.length
    ? section(
        "Education",
        c.education
          .map(
            (e) => `
        <div class="item">
          <div class="item-head">
            <div><strong>${esc(e.degree) || "Degree"}</strong>${e.field ? `, ${esc(e.field)}` : ""}</div>
            <div class="muted">${dateRange(e.startDate, e.endDate)}</div>
          </div>
          <div class="muted small">${esc(e.institution)}${e.gpa ? ` · GPA ${esc(e.gpa)}` : ""}</div>
          ${e.description ? `<p>${esc(e.description)}</p>` : ""}
        </div>`,
          )
          .join(""),
      )
    : "";

  const allSkills = [
    ...c.skills.technical,
    ...c.skills.frameworks,
    ...c.skills.tools,
    ...c.skills.soft,
    ...c.skills.languages,
  ];
  const skills = allSkills.length ? section("Skills", chips(allSkills)) : "";

  const projects = c.projects.length
    ? section(
        "Projects",
        c.projects
          .map(
            (pr) => `
        <div class="item">
          <div class="item-head">
            <div><strong>${esc(pr.name) || "Project"}</strong></div>
            <div class="muted">${dateRange(pr.startDate, pr.endDate)}</div>
          </div>
          ${pr.description ? `<p>${esc(pr.description)}</p>` : ""}
          ${pr.technologies.length ? chips(pr.technologies) : ""}
        </div>`,
          )
          .join(""),
      )
    : "";

  const certifications = c.certifications.length
    ? section(
        "Certifications",
        list(
          c.certifications.map(
            (ct) =>
              `${ct.name}${ct.organization ? ` — ${ct.organization}` : ""}${ct.issueDate ? ` (${ct.issueDate})` : ""}`,
          ),
        ),
      )
    : "";

  const languages = c.languages.length
    ? section(
        "Languages",
        list(c.languages.map((l) => `${l.language}${l.proficiency ? ` — ${l.proficiency}` : ""}`)),
      )
    : "";

  const achievements = c.achievements.length
    ? section(
        "Achievements",
        list(
          c.achievements.map(
            (a) => `${a.title}${a.description ? ` — ${a.description}` : ""}`,
          ),
        ),
      )
    : "";

  return [
    header,
    summary,
    experience,
    projects,
    education,
    skills,
    certifications,
    achievements,
    languages,
  ].join("");
}

const TEMPLATE_CSS: Record<ResumeTemplate, string> = {
  minimal: `
    body{--accent:#0f172a;font-family:Georgia,'Times New Roman',serif}
    .head h1{font-weight:600}
    h2{border-bottom:1px solid #e2e8f0}`,
  modern: `
    body{--accent:#6366f1;font-family:'Segoe UI',Helvetica,Arial,sans-serif}
    .head{border-left:5px solid var(--accent);padding-left:14px}
    h2{color:var(--accent)}
    .chip{background:#eef2ff;color:#4338ca}`,
  professional: `
    body{--accent:#1e3a8a;font-family:'Segoe UI',Helvetica,Arial,sans-serif}
    .head{text-align:left;border-bottom:3px solid var(--accent);padding-bottom:10px}
    h2{color:var(--accent);text-transform:uppercase;letter-spacing:.06em;font-size:12px}`,
  executive: `
    body{--accent:#111827;font-family:Georgia,'Times New Roman',serif}
    .head{text-align:center;border-bottom:2px solid var(--accent);padding-bottom:12px}
    .head .contacts{justify-content:center}
    h2{text-align:left;text-transform:uppercase;letter-spacing:.12em;font-size:12px}`,
  technical: `
    body{--accent:#0ea5e9;font-family:'Segoe UI',Helvetica,Arial,sans-serif}
    .head{border-bottom:3px solid var(--accent)}
    h2{color:var(--accent);font-family:'SFMono-Regular',Consolas,monospace;font-size:13px}
    .chip{background:#e0f2fe;color:#0369a1;font-family:'SFMono-Regular',Consolas,monospace}`,
};

export function getResumeHtml(
  content: ResumeContent,
  template: ResumeTemplate,
): string {
  const base = `
    *{box-sizing:border-box}
    @page{size:A4;margin:0}
    html,body{margin:0;padding:0}
    body{color:#0f172a;font-size:13px;line-height:1.5;--accent:#6366f1}
    .page{width:210mm;min-height:297mm;padding:18mm 16mm;background:#fff;margin:0 auto}
    .head h1{margin:0;font-size:26px}
    .head .role{color:var(--accent);font-weight:600;margin-top:2px;font-size:15px}
    .head .contacts{display:flex;flex-wrap:wrap;gap:6px;color:#475569;font-size:11.5px;margin-top:8px;align-items:center}
    .head .contacts .dot{color:#cbd5e1}
    .sec{margin-top:16px}
    h2{margin:0 0 8px;font-size:13px;padding-bottom:4px}
    .item{margin-bottom:10px}
    .item-head{display:flex;justify-content:space-between;gap:12px}
    p{margin:4px 0}
    .muted{color:#64748b;font-size:11.5px}
    .small{font-size:11px}
    ul{margin:4px 0 0;padding-left:18px}
    li{margin:2px 0}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
    .chip{background:#f1f5f9;color:#334155;border-radius:999px;padding:2px 10px;font-size:11px}
  `;
  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>${base}${TEMPLATE_CSS[template] ?? TEMPLATE_CSS.modern}</style></head>
<body data-template="${esc(template)}"><div class="page">${renderBody(content)}</div></body></html>`;
}
