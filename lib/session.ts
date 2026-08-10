import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/**
 * For use in server components / pages. Redirects to /login when unauthenticated.
 */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Ensures a user row exists and returns it (with subscription).
 */
export async function getCurrentUserRecord() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  return prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { subscription: true },
  });
}
