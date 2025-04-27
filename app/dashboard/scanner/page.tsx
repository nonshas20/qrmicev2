"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRScanner } from "@/components/qr/qr-scanner";
import { Event, Attendance } from "@/types";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Calendar } from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        // Fetch events from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: false });

        if (error) {
          throw error;
        }

        setEvents(data || []);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId);
      setSelectedEvent(event || null);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId, events]);

  const handleAttendanceRecorded = (attendance: Attendance) => {
    // Show a toast or update UI when attendance is recorded
    // This could be expanded to show more details about the attendance record
    const status = attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1);
    const message = `${status} attendance recorded successfully`;

    // Refresh the page after a short delay to ensure the attendance record is updated
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Event
          </CardTitle>
          <CardDescription>Choose an event to track attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Select onValueChange={setSelectedEventId} value={selectedEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No events available
                  </SelectItem>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedEvent ? (
        <QRScanner
          event={selectedEvent}
          onAttendanceRecorded={handleAttendanceRecorded}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Please select an event to begin scanning QR codes.</p>
        </Card>
      )}
    </div>
  );
}