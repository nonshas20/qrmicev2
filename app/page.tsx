import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Users, Calendar, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-12">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">MICE Attendance System</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              QR code-based attendance tracking system for Meetings, Incentives, Conferences, and Exhibitions events
            </p>
          </header>

          <div className="flex justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-2">
                  <QrCode size={24} />
                </div>
                <CardTitle>QR Code Tracking</CardTitle>
                <CardDescription>Generate and scan QR codes for quick attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Easily generate QR codes for students and scan them for time-in and time-out tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-2">
                  <Users size={24} />
                </div>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Efficiently manage student information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add, edit, and organize student details with an intuitive management interface.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-2">
                  <Calendar size={24} />
                </div>
                <CardTitle>Event Organization</CardTitle>
                <CardDescription>Create and manage MICE events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Schedule and organize events with detailed information and attendance tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-2">
                  <BarChart3 size={24} />
                </div>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Comprehensive attendance analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate detailed reports and visualize attendance data with interactive charts.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MICE Attendance System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}