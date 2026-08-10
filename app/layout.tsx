import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "CareerAI — AI Resume Builder & Document Summarizer",
    template: "%s | CareerAI",
  },
  description:
    "Build professional, ATS-friendly resumes with AI and summarize lengthy documents instantly. Create. Improve. Understand.",
  keywords: [
    "AI resume builder",
    "ATS resume",
    "document summarizer",
    "AI cover letter",
    "resume templates",
  ],
  openGraph: {
    title: "CareerAI — AI Resume Builder & Document Summarizer",
    description:
      "Build professional resumes with AI and summarize documents instantly.",
    type: "website",
    url: "/",
    siteName: "CareerAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerAI",
    description:
      "Build professional resumes with AI and summarize documents instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
