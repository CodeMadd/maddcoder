import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (await getSessionUser()) redirect("/dashboard");
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <AuthForm
      mode="register"
      googleEnabled={googleEnabled}
      next={searchParams.next || "/dashboard"}
    />
  );
}
