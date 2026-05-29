"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Luggage, Store, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  image,
  role,
}: {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-pangong">
        <Avatar className="size-8 bg-pangong-tint">
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback className="bg-pangong-tint text-xs font-semibold text-pangong-deep">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="truncate text-xs text-ink-muted">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/trips")}>
          <Luggage /> My trips
        </DropdownMenuItem>
        {role === "VENDOR" ? (
          <DropdownMenuItem onClick={() => router.push("/vendor/dashboard")}>
            <LayoutDashboard /> Vendor dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => router.push("/vendor/onboarding")}>
            <Store /> List your business
          </DropdownMenuItem>
        )}
        {role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldCheck /> Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
