"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { profileSchema } from "@/lib/validators/profile";
import { AvatarUpload } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  initialName,
  initialImage,
  email,
}: {
  initialName: string;
  initialImage: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name !== initialName || image !== initialImage;

  async function onSubmit() {
    setError(null);
    const parsed = profileSchema.safeParse({ name, image });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setPending(true);
    try {
      const res = await updateProfile(parsed.data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-4 rounded-card border border-border bg-surface p-5">
        <div className="space-y-1.5">
          <Label>Photo</Label>
          <AvatarUpload
            folder="avatars"
            value={image || undefined}
            fallback={(name.trim()[0] ?? "?").toUpperCase()}
            onChange={(url) => setImage(url ?? "")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled readOnly />
          <p className="text-[11.5px] text-ink-muted">
            Your email is how you sign in, so it can&apos;t be changed here.
          </p>
        </div>

        {error && (
          <p className="rounded-control bg-danger-tint px-3 py-2 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !dirty}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
