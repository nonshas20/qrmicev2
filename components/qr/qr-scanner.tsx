"use client";

import { useState, useEffect } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Student, Event, Attendance } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { QrCode, UserCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface QRScannerProps {
  event: Event;
  onAttendanceRecorded: (attendance: Attendance) => void;
}

export function QRScanner({ event, onAttendanceRecorded }: QRScannerProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'time-in' | 'time-out'>('time-in');
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{student: Student, status: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async (result: string) => {
    try {
      setError(null);
      
      // Parse the QR code data
      const qrData = JSON.parse(result);
      
      if (!qrData.id) {
        throw new Error("Invalid QR code format");
      }

      // Fetch student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', qrData.id)
        .single();

      if (studentError || !studentData) {
        throw new Error("Student not found");
      }

      // Check if attendance record exists
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', qrData.id)
        .eq('event_id', event.id)
        .single();

      const now = new Date().toISOString();
      
      if (mode === 'time-in') {
        // Handle time-in logic
        if (attendanceData && attendanceData.time_in) {
          setLastScanned({ 
            student: studentData,
            status: "already-checked-in"
          });
          return;
        }

        const { data: newAttendance, error: createError } = attendanceData
          ? await supabase
              .from('attendance')
              .update({ 
                time_in: now,
                status: 'present',
                updated_at: now
              })
              .eq('id', attendanceData.id)
              .select()
              .single()
          : await supabase
              .from('attendance')
              .insert({ 
                student_id: qrData.id,
                event_id: event.id,
                time_in: now,
                status: 'present'
              })
              .select()
              .single();

        if (createError) {
          throw new Error("Failed to record attendance");
        }

        // Call API route to send email notification
        // This would be implemented in a separate API route

        setLastScanned({ 
          student: studentData,
          status: "checked-in"
        });
        
        onAttendanceRecorded(newAttendance);
        
        toast({
          title: "Time-in recorded",
          description: `${studentData.name} has been checked in`,
          duration: 3000,
        });

      } else {
        // Handle time-out logic
        if (!attendanceData || !attendanceData.time_in) {
          setLastScanned({ 
            student: studentData,
            status: "not-checked-in"
          });
          return;
        }

        if (attendanceData.time_out) {
          setLastScanned({ 
            student: studentData,
            status: "already-checked-out"
          });
          return;
        }

        const { data: updatedAttendance, error: updateError } = await supabase
          .from('attendance')
          .update({ 
            time_out: now,
            updated_at: now
          })
          .eq('id', attendanceData.id)
          .select()
          .single();

        if (updateError) {
          throw new Error("Failed to record time-out");
        }

        // Call API route to send email notification
        // This would be implemented in a separate API route

        setLastScanned({ 
          student: studentData,
          status: "checked-out"
        });
        
        onAttendanceRecorded(updatedAttendance);
        
        toast({
          title: "Time-out recorded",
          description: `${studentData.name} has been checked out`,
          duration: 3000,
        });
      }
    } catch (err: any) {
      console.error("QR scan error:", err);
      setError(err.message || "Failed to process QR code");
      toast({
        title: "Scan Error",
        description: err.message || "Failed to process QR code",
        variant: "destructive",
      });
    }
  };

  const toggleScanner = () => {
    setScanning(!scanning);
    setError(null);
    setLastScanned(null);
  };

  const getStatusBadge = () => {
    if (!lastScanned) return null;
    
    switch (lastScanned.status) {
      case "checked-in":
        return <Badge className="bg-green-500">Checked In</Badge>;
      case "checked-out":
        return <Badge className="bg-blue-500">Checked Out</Badge>;
      case "already-checked-in":
        return <Badge variant="outline">Already Checked In</Badge>;
      case "already-checked-out":
        return <Badge variant="outline">Already Checked Out</Badge>;
      case "not-checked-in":
        return <Badge variant="destructive">Not Checked In</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Scanner
        </CardTitle>
        <CardDescription>
          Scan student QR codes to record {mode === 'time-in' ? 'time-in' : 'time-out'} for {event.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {lastScanned && (
          <Alert variant={
            lastScanned.status === "checked-in" || lastScanned.status === "checked-out" 
              ? "default" 
              : "warning"
          }>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Student Information</AlertTitle>
                {getStatusBadge()}
              </div>
              <AlertDescription>
                <div className="text-sm">
                  <p><strong>Name:</strong> {lastScanned.student.name}</p>
                  <p><strong>Email:</strong> {lastScanned.student.email}</p>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        <div className="flex space-x-2 mb-4">
          <Button
            variant={mode === 'time-in' ? 'default' : 'outline'}
            onClick={() => setMode('time-in')}
            className="flex-1"
          >
            <UserCheck className="mr-2 h-4 w-4" /> Time-In
          </Button>
          <Button
            variant={mode === 'time-out' ? 'default' : 'outline'}
            onClick={() => setMode('time-out')}
            className="flex-1"
          >
            <Clock className="mr-2 h-4 w-4" /> Time-Out
          </Button>
        </div>

        {scanning ? (
          <div className="rounded-lg overflow-hidden">
            <QrScanner
              onDecode={handleDecode}
              onError={(error) => setError(error?.message || "Scanner error")}
              scanDelay={500}
              constraints={{
                facingMode: "environment"
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center p-10 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Click Start Scanner to begin scanning QR codes</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={toggleScanner} 
          className="w-full"
          variant={scanning ? "secondary" : "default"}
        >
          {scanning ? "Stop Scanner" : "Start Scanner"}
        </Button>
      </CardFooter>
    </Card>
  );
}