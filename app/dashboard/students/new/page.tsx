import { StudentForm } from "@/components/students/student-form";

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
      </div>
      
      <StudentForm />
    </div>
  );
}