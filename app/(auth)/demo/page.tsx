import type { Metadata } from "next";
import { DemoLauncher } from "@/components/auth/demo-launcher";

export const metadata: Metadata = {
  title: "Live Demo",
  description:
    "Explore CareerAI instantly with a pre-loaded demo account — no signup required.",
};

export default function DemoPage() {
  return <DemoLauncher />;
}
