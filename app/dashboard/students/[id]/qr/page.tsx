"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRGenerator } from "@/components/qr/qr-generator";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function StudentQRPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const shouldPrint = searchParams.get('print') === 'true';

  useEffect(() => {
    async function fetchStudent() {
      setLoading(true);

      try {
        // Fetch student from Supabase
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        setStudent(data);

        if (shouldPrint) {
          // Automatically trigger print dialog after a short delay
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      } catch (error: any) {
        console.error("Error fetching student:", error);
        toast({
          title: "Error",
          description: "Failed to load student information: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchStudent();
    }
  }, [params.id, shouldPrint, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading student information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Student QR Code</h2>
      </div>

      {student ? (
        <QRGenerator student={student} />
      ) : (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">Student not found</p>
        </div>
      )}
    </div>
  );
}