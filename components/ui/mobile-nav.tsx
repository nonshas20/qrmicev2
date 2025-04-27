"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { 
  LucideIcon, 
  QrCode, 
  Users, 
  Calendar, 
  LineChart, 
  Settings, 
  Home, 
  Menu, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export function MobileNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
    <div className={cn("block sm:hidden", className)} {...props}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <span>MICE Attendance</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center py-2 text-base font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
