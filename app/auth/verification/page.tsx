import { QrCode, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">MICE Attendance</h1>
            <p className="text-muted-foreground">
              Email verification required
            </p>
          </div>
          
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">Check Your Email</CardTitle>
              <CardDescription>
                We&apos;ve sent a verification link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center py-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please check your email inbox and click on the verification link to complete your registration.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you don&apos;t see the email, check your spam folder.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Link href="/auth/login" className="w-full">
                <Button className="w-full flex items-center justify-center gap-2">
                  <span>Continue to Login</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive an email?{" "}
                  <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
                    Try again
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <div className="text-center">
            <Link 
              href="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
