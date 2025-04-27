"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StudentForm } from "@/components/students/student-form";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EditStudentPage() {
  const params = useParams();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading student information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Student</h2>
      </div>

      {student ? (
        <StudentForm student={student} isEditing />
      ) : (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">Student not found</p>
        </div>
      )}
    </div>
  );
}