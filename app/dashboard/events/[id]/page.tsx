"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { Event } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EditEventPage() {
  const params = useParams();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Event</h2>
      </div>

      {event ? (
        <EventForm event={event} isEditing />
      ) : (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      )}
    </div>
  );
}
