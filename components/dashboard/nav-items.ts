import {
  LayoutDashboard,
  Wand2,
  FileStack,
  FileText,
  Files,
  Gauge,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard,
    match: (p) => p === "/dashboard" },
  { href: "/dashboard/resumes/new", label: "Resume Builder", icon: Wand2,
    match: (p) => p.startsWith("/dashboard/resumes/") },
  { href: "/dashboard/resumes", label: "My Resumes", icon: FileStack,
    match: (p) => p === "/dashboard/resumes" },
  { href: "/dashboard/documents/new", label: "Document Summarizer", icon: FileText,
    match: (p) => p.startsWith("/dashboard/documents/") },
  { href: "/dashboard/documents", label: "My Documents", icon: Files,
    match: (p) => p === "/dashboard/documents" },
  { href: "/dashboard/usage", label: "Usage", icon: Gauge },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
