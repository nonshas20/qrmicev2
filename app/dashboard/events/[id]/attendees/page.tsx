"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { AttendeesList } from "@/components/events/attendees-list";
import { Event } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);

      try {
        // Fetch event from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        setEvent(data);
      } catch (error: any) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to load event information: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchEvent();
    }
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading event information...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm" className="gap-1 w-fit">
              <ChevronLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Event Attendees</h2>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/scanner?event=${event.id}`)}
            className="w-full sm:w-auto"
          >
            Scan QR Codes
          </Button>
        </div>
      </div>

      <AttendeesList event={event} />
    </div>
  );
}
