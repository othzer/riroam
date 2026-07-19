"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  // /welcome resolves the real destination server-side from the account's
  // role; an explicit callbackUrl (a guarded page the user was bounced off)
  // still wins.
  const dest = callbackUrl || "/welcome";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setPending(true);
    try {
      const res = await signIn("credentials", { ...values, redirect: false });
      if (res?.error) {
        toast.error("Wrong email or password");
        return;
      }
      router.push(dest);
      router.refresh();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl: dest })}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
