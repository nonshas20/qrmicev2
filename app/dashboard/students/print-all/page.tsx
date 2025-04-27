"use client";

import { useEffect, useState } from "react";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function PrintAllQRCodesPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);

      try {
        // Fetch all students from Supabase
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStudents(data || []);

        // Automatically trigger print dialog after a short delay to allow QR codes to render
        setTimeout(() => {
          window.print();
        }, 1500);
      } catch (error: any) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [toast]);

  // Create QR data for a student
  const getQRData = (student: Student) => {
    return JSON.stringify({
      id: student.id,
      name: student.name,
      email: student.email,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading students information...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation and controls - hidden when printing */}
      <div className="print:hidden space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Students
            </Button>
          </Link>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print QR Codes
          </Button>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Print All Student QR Codes</h2>
        <p className="text-muted-foreground">
          {students.length} QR codes ready to print. Each QR code is sized to fit on a standard school ID.
        </p>
      </div>

      {/* QR Code Grid - optimized for printing */}
      <div id="qr-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print:m-0 print:p-0">
        {students.map((student) => (
          <div
            key={student.id}
            className="qr-card flex flex-col items-center p-3 border rounded-lg bg-white print:border print:break-inside-avoid"
            style={{
              width: '2.5in',
              height: '3.5in',
              maxWidth: '2.5in',
              maxHeight: '3.5in',
              margin: '0 auto',
              pageBreakInside: 'avoid'
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="text-center mb-2">
                <div className="font-bold text-sm print:text-xs">STUDENT ID</div>
              </div>
              <QRCodeSVG
                value={getQRData(student)}
                size={150}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              <div className="mt-3 text-center">
                <div className="font-bold text-base print:text-sm">{student.name}</div>
                <div className="text-xs text-muted-foreground">{student.student_id || student.email}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5cm;
          }

          /* Hide all elements except the QR code grid */
          body * {
            visibility: hidden;
          }

          /* Only show the QR code grid and its children */
          #qr-grid {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0.5cm !important;
          }

          #qr-grid * {
            visibility: visible !important;
          }

          /* Make sure the QR cards are properly displayed */
          .qr-card {
            background-color: white !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }

          /* Basic styling */
          body {
            margin: 0;
            padding: 0;
            background: white;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Ensure QR codes print at the correct size */
          svg {
            width: 150px !important;
            height: 150px !important;
          }

          /* Ensure cards don't break across pages */
          .grid > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
