"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackageOpen, CalendarCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/listings", label: "Listings", icon: PackageOpen },
  { href: "/vendor/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/vendor/reviews", label: "Reviews", icon: Star },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-pangong-tint text-pangong-deep"
                : "text-ink-soft hover:bg-sand hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
