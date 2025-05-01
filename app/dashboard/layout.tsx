import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { MainNav } from "@/components/ui/main-nav";
import { MobileNav } from "@/components/ui/mobile-nav";
import { UserNav } from "@/components/ui/user-nav";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { QrCode } from "lucide-react";

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a Supabase client
  const supabase = createServerComponentClient({ cookies });

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get the user's profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    profile = data;
  }

  // Prepare user data for UserNav
  const userData = user ? {
    id: user.id,
    email: user.email || "",
    name: profile?.full_name || user.email?.split('@')[0] || "User"
  } : { id: "", email: "", name: "Guest" };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2 font-semibold">
            <QrCode className="h-6 w-6" />
            <span>MICE Attendance</span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <ModeToggle />
            <UserNav user={userData} />
          </div>
        </div>
      </header>
      <div className="flex-1">
        <div className="border-b">
          <div className="container flex h-14 items-center">
            <MobileNav />
            <MainNav />
          </div>
        </div>
        <div className="container py-6">
          {children}
        </div>
      </div>
    </div>
  );
}