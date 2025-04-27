"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LucideIcon, QrCode, Users, Calendar, LineChart, Settings, Home } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "QR Scanner",
      href: "/dashboard/scanner",
      icon: QrCode,
    },
    {
      title: "Students",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      title: "Events",
      href: "/dashboard/events",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: LineChart,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <nav
      className={cn("hidden sm:flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground",
            item.disabled && "cursor-not-allowed opacity-80"
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}