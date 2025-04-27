import { SignupForm } from "@/components/auth/signup-form";
import { QrCode } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
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
              Create an account to manage attendance
            </p>
          </div>
          <SignupForm />
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