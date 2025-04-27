"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Event, AttendanceWithStudent } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function PrintAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendanceWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // Fetch event from Supabase
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', params.id)
          .single();

        if (eventError) {
          throw eventError;
        }

        setEvent(eventData);

        // Fetch attendance records with student information
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('attendance')
          .select(`
            *,
            student:students(*)
          `)
          .eq('event_id', params.id);

        if (attendeesError) {
          throw attendeesError;
        }

        // Transform the data to match the AttendanceWithStudent interface
        const formattedData = attendeesData.map(item => ({
          ...item,
          student: item.student
        })) as AttendanceWithStudent[];

        // Sort attendees by name
        formattedData.sort((a, b) => a.student.name.localeCompare(b.student.name));

        setAttendees(formattedData);

        // We'll no longer auto-print on page load
        // Instead, we'll use the print button to open a clean print window
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, toast]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      case 'excused': return 'Excused';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading data for printing...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/events')}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Printing Error",
        description: "Could not open print dialog. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }

    // Generate the HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${event.title} - Attendees List</title>
          <style>
            @page {
              size: landscape;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              font-size: 12pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-present {
              color: #10b981;
            }
            .status-late {
              color: #f59e0b;
            }
            .status-absent {
              color: #ef4444;
            }
            .status-excused {
              color: #3b82f6;
            }
            /* Hide all non-table elements when printing */
            @media print {
              body * {
                visibility: hidden;
              }
              table, table * {
                visibility: visible;
              }
              table {
                position: absolute;
                left: 0;
                top: 0;
              }
              button, .header, .footer {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${attendees.length === 0
                ? `<tr><td colspan="6" style="text-align: center;">No attendees found</td></tr>`
                : attendees.map((attendee, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${attendee.student.name}</td>
                    <td>${attendee.student.email}</td>
                    <td>${attendee.time_in
                      ? format(new Date(attendee.time_in), "MMM d, yyyy h:mm a")
                      : "Not recorded"}</td>
                    <td>${attendee.time_out
                      ? format(new Date(attendee.time_out), "MMM d, yyyy h:mm a")
                      : "Not recorded"}</td>
                    <td class="status-${attendee.status}">${getStatusText(attendee.status)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <button onclick="window.print();setTimeout(window.close, 500);">Print</button>
        </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Automatically trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Link href={`/dashboard/events/${event.id}/attendees`}>
            <Button variant="ghost" size="sm" className="gap-1 w-fit">
              <ChevronLeft className="h-4 w-4" />
              Back to Attendees
            </Button>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Print Attendees List</h2>
        </div>
        <Button onClick={handlePrint} className="gap-2 w-full sm:w-auto">
          <Printer className="h-4 w-4" />
          Print Attendees
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 text-left font-medium">No.</th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium hidden md:table-cell">Email</th>
              <th className="p-3 text-left font-medium hidden sm:table-cell">Time In</th>
              <th className="p-3 text-left font-medium hidden sm:table-cell">Time Out</th>
              <th className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center">No attendees found</td>
              </tr>
            ) : (
              attendees.map((attendee, index) => (
                <tr key={attendee.id} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">{attendee.student.name}</td>
                  <td className="p-3 hidden md:table-cell">{attendee.student.email}</td>
                  <td className="p-3 hidden sm:table-cell">
                    {attendee.time_in
                      ? format(new Date(attendee.time_in), "MMM d, yyyy h:mm a")
                      : "Not recorded"}
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {attendee.time_out
                      ? format(new Date(attendee.time_out), "MMM d, yyyy h:mm a")
                      : "Not recorded"}
                  </td>
                  <td className="p-3">
                    <span className={
                      attendee.status === 'present' ? 'text-green-500' :
                      attendee.status === 'late' ? 'text-yellow-500' :
                      attendee.status === 'absent' ? 'text-red-500' :
                      attendee.status === 'excused' ? 'text-blue-500' : ''
                    }>
                      {getStatusText(attendee.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Total Attendees: {attendees.length}
      </div>
    </div>
  );
}
