"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Event, AttendanceWithStudent } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AttendeesListProps {
  event: Event;
}

export function AttendeesList({ event }: AttendeesListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<AttendanceWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attendeeToUpdate, setAttendeeToUpdate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'late' | 'absent' | 'excused'>('present');
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  useEffect(() => {
    fetchAttendees();
  }, [event.id]);

  async function fetchAttendees() {
    setLoading(true);

    try {
      // Fetch attendance records with student information
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(*)
        `)
        .eq('event_id', event.id);

      if (error) {
        throw error;
      }

      // Transform the data to match the AttendanceWithStudent interface
      const formattedData = data.map(item => ({
        ...item,
        student: item.student
      })) as AttendanceWithStudent[];

      setAttendees(formattedData);
    } catch (error: any) {
      console.error("Error fetching attendees:", error);
      toast({
        title: "Error",
        description: "Failed to load attendees: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async () => {
    if (!attendeeToUpdate || !newStatus) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeToUpdate);

      if (error) {
        throw error;
      }

      // Update local state
      setAttendees(attendees.map(attendee =>
        attendee.id === attendeeToUpdate
          ? { ...attendee, status: newStatus }
          : attendee
      ));

      toast({
        title: "Status updated",
        description: "Attendance status has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status: " + error.message,
        variant: "destructive",
      });
    } finally {
      setAttendeeToUpdate(null);
      setShowStatusDialog(false);
    }
  };

  // Filter attendees based on search term and status filter
  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch =
      attendee.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      attendee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Present
          </Badge>
        );
      case 'late':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Late
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Absent
          </Badge>
        );
      case 'excused':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Excused
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Information about the event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Title</p>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{event.location || "No location"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.start_date), "PPP p")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.end_date), "PPP p")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search attendees..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchAttendees} variant="outline" className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <p>Loading attendees...</p>
        </div>
      ) : attendees.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No attendance records found for this event.</p>
          <p className="text-muted-foreground mt-2">
            Use the QR scanner to record attendance or manually add records.
          </p>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Student ID</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">Email</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">Time In</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">Time Out</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No matching attendees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="whitespace-nowrap">{attendee.student.student_id}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{attendee.student.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{attendee.student.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {attendee.time_in
                        ? format(new Date(attendee.time_in), "MMM d, yyyy h:mm a")
                        : "Not recorded"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {attendee.time_out
                        ? format(new Date(attendee.time_out), "MMM d, yyyy h:mm a")
                        : "Not recorded"}
                    </TableCell>
                    <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setAttendeeToUpdate(attendee.id);
                              setNewStatus(attendee.status as any);
                              setShowStatusDialog(true);
                            }}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Attendance Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new status for this attendance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={(value: any) => setNewStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Present
                  </div>
                </SelectItem>
                <SelectItem value="late">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                    Late
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center">
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Absent
                  </div>
                </SelectItem>
                <SelectItem value="excused">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Excused
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStatus}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
