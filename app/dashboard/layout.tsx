import { requireUser } from "@/lib/session";
import { getUserPlan } from "@/lib/usage";
import { planLabel } from "@/lib/plans";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image }}
      plan={planLabel(plan)}
    >
      {children}
    </DashboardShell>
  );
}
