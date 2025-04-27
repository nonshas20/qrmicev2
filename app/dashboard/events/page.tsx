"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types";
import { MoreHorizontal, Search, QrCode, Edit, Trash, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      console.log("Deleting event with ID:", eventToDelete);

      // First delete all attendance records for this event
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('event_id', eventToDelete)
        .select();

      if (attendanceError) {
        console.error("Error deleting attendance records:", attendanceError);
        throw attendanceError;
      }

      console.log("Deleted attendance records:", attendanceData);

      // Then delete the event itself
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete)
        .select();

      if (eventError) {
        console.error("Error deleting event:", eventError);
        throw eventError;
      }

      console.log("Deleted event:", eventData);

      // Update local state
      setEvents(events.filter(e => e.id !== eventToDelete));

      // Refresh the events list from the server to ensure we have the latest data
      fetchEvents();

      toast({
        title: "Event deleted",
        description: "Event and all related attendance records have been removed from the system",
      });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event: " + error.message,
        variant: "destructive",
      });
    } finally {
      setEventToDelete(null);
    }
  };

  // Function to fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);

    try {
      console.log("Fetching events...");
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Fetched events:", data);
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Events</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/dashboard/events/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Add Event</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <p>Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">No events found</p>
            {searchTerm && (
              <p className="text-xs text-muted-foreground">
                Try adjusting your search term
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Title</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">Location</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const isUpcoming = startDate > new Date();
                const isPast = endDate < new Date();
                const isOngoing = startDate <= new Date() && endDate >= new Date();

                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium whitespace-nowrap">{event.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{event.location || "No location"}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(startDate, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {isUpcoming && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          Upcoming
                        </Badge>
                      )}
                      {isOngoing && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Ongoing
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Past
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}/attendees`)}>
                            <Users className="mr-2 h-4 w-4" />
                            Attendees
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/scanner?event=${event.id}`)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan QR
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setEventToDelete(event.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all associated attendance records.
              This action cannot be undone and will remove all attendance data for this event.
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