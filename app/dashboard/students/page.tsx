"use client";

import { useState, useEffect } from "react";
import { StudentList } from "@/components/students/student-list";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        setStudents(data || []);
      } catch (error: any) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [toast]);

  const handleGenerateQR = (id: string) => {
    router.push(`/dashboard/students/${id}/qr`);
  };

  const handlePrintQR = (id: string) => {
    router.push(`/dashboard/students/${id}/qr?print=true`);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete);

      if (error) {
        throw error;
      }
      
      setStudents(students.filter(s => s.id !== studentToDelete));
      
      toast({
        title: "Student deleted",
        description: "Student has been removed from the system",
      });
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Students</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <p>Loading students...</p>
        </div>
      ) : (
        <StudentList
          students={students}
          onDelete={(id) => setStudentToDelete(id)}
          onPrint={handlePrintQR}
          onGenerateQR={handleGenerateQR}
        />
      )}

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and their attendance records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}