"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed in this demo.</p>
      </div>
      <Button variant="gradient" onClick={save} loading={saving}>
        Save changes
      </Button>
    </div>
  );
}
