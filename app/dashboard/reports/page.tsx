"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, subMonths, isAfter, isBefore, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Event, Attendance, Student, AttendanceStats } from "@/types";
import "./print.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Filter,
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  });

  // Filter states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subMonths(new Date(), 3),
    to: new Date()
  });
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [timeFrame, setTimeFrame] = useState<string>("3months");

  // Chart data
  const [eventAttendanceData, setEventAttendanceData] = useState<any[]>([]);
  const [statusDistributionData, setStatusDistributionData] = useState<any[]>([]);
  const [attendanceTrendData, setAttendanceTrendData] = useState<any[]>([]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Fetch attendance records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*');

        if (attendanceError) throw attendanceError;
        setAttendanceRecords(attendanceData || []);

        // Process data for charts and stats
        processData(eventsData || [], attendanceData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Process data when filters change
  useEffect(() => {
    if (events.length > 0 && attendanceRecords.length > 0) {
      processData(events, attendanceRecords);
    }
  }, [dateRange, selectedEvent, timeFrame, events, attendanceRecords]);

  // Process data for charts and stats
  const processData = (eventsData: Event[], attendanceData: Attendance[]) => {
    // Filter data based on date range
    let filteredEvents = eventsData;
    if (dateRange.from && dateRange.to) {
      filteredEvents = eventsData.filter(event => {
        const eventDate = parseISO(event.start_date);
        return isAfter(eventDate, dateRange.from!) && isBefore(eventDate, dateRange.to!);
      });
    }

    // Filter by selected event
    if (selectedEvent !== "all") {
      filteredEvents = eventsData.filter(event => event.id === selectedEvent);
    }

    // Get event IDs for filtering attendance
    const eventIds = filteredEvents.map(event => event.id);

    // Filter attendance records
    const filteredAttendance = attendanceData.filter(record =>
      eventIds.includes(record.event_id)
    );

    // Calculate overall stats
    const newStats: AttendanceStats = {
      total: filteredAttendance.length,
      present: filteredAttendance.filter(record => record.status === 'present').length,
      late: filteredAttendance.filter(record => record.status === 'late').length,
      absent: filteredAttendance.filter(record => record.status === 'absent').length,
      excused: filteredAttendance.filter(record => record.status === 'excused').length
    };
    setStats(newStats);

    // Prepare data for event attendance chart
    const eventAttendance = filteredEvents.map(event => {
      const eventRecords = filteredAttendance.filter(record => record.event_id === event.id);
      return {
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        Present: eventRecords.filter(record => record.status === 'present').length,
        Late: eventRecords.filter(record => record.status === 'late').length,
        Absent: eventRecords.filter(record => record.status === 'absent').length,
        Excused: eventRecords.filter(record => record.status === 'excused').length,
        Total: eventRecords.length
      };
    });
    setEventAttendanceData(eventAttendance);

    // Prepare data for status distribution pie chart
    const statusDistribution = [
      { name: 'Present', value: newStats.present, color: 'hsl(var(--chart-1))' },
      { name: 'Late', value: newStats.late, color: 'hsl(var(--chart-2))' },
      { name: 'Absent', value: newStats.absent, color: 'hsl(var(--chart-3))' },
      { name: 'Excused', value: newStats.excused, color: 'hsl(var(--chart-4))' }
    ];
    setStatusDistributionData(statusDistribution);

    // Prepare data for attendance trend line chart
    // Group events by month
    const eventsByMonth: Record<string, any> = {};
    filteredEvents.forEach(event => {
      const month = format(parseISO(event.start_date), 'MMM yyyy');
      if (!eventsByMonth[month]) {
        eventsByMonth[month] = {
          name: month,
          Present: 0,
          Late: 0,
          Absent: 0,
          Excused: 0,
          Total: 0
        };
      }

      const eventRecords = filteredAttendance.filter(record => record.event_id === event.id);
      eventsByMonth[month].Present += eventRecords.filter(record => record.status === 'present').length;
      eventsByMonth[month].Late += eventRecords.filter(record => record.status === 'late').length;
      eventsByMonth[month].Absent += eventRecords.filter(record => record.status === 'absent').length;
      eventsByMonth[month].Excused += eventRecords.filter(record => record.status === 'excused').length;
      eventsByMonth[month].Total += eventRecords.length;
    });

    // Convert to array and sort by date
    const trendData = Object.values(eventsByMonth).sort((a, b) => {
      return new Date(a.name).getTime() - new Date(b.name).getTime();
    });
    setAttendanceTrendData(trendData);
  };

  // Handle time frame change
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value);

    const now = new Date();
    let fromDate;

    switch (value) {
      case "1month":
        fromDate = subMonths(now, 1);
        break;
      case "3months":
        fromDate = subMonths(now, 3);
        break;
      case "6months":
        fromDate = subMonths(now, 6);
        break;
      case "1year":
        fromDate = subMonths(now, 12);
        break;
      case "all":
        fromDate = undefined;
        break;
      default:
        fromDate = subMonths(now, 3);
    }

    setDateRange({
      from: fromDate,
      to: now
    });
  };

  // Export report as CSV
  const exportCSV = () => {
    try {
      // Create CSV content
      let csvContent = "Event,Date,Present,Late,Absent,Excused,Total\n";

      eventAttendanceData.forEach(event => {
        const eventObj = events.find(e => e.title === event.name || e.title.startsWith(event.name.replace('...', '')));
        const date = eventObj ? format(parseISO(eventObj.start_date), 'yyyy-MM-dd') : 'N/A';
        csvContent += `"${event.name}","${date}",${event.Present},${event.Late},${event.Absent},${event.Excused},${event.Total}\n`;
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Exported",
        description: "The attendance report has been exported as CSV.",
      });
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export the report: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Calculate percentages for stats
  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const latePercentage = stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0;
  const absentPercentage = stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0;
  const excusedPercentage = stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p>Loading reports data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible when printing */}
      <div className="print-header hidden">
        <h1>MICE Attendance System - Attendance Report</h1>
        <p>Generated on {format(new Date(), "MMMM d, yyyy")}</p>
        <p>
          {timeFrame === "all"
            ? "All Time"
            : `Date Range: ${dateRange.from ? format(dateRange.from, "MMM d, yyyy") : ""} - ${dateRange.to ? format(dateRange.to, "MMM d, yyyy") : ""}`}
        </p>
        <p>
          Event: {selectedEvent === "all"
            ? "All Events"
            : events.find(e => e.id === selectedEvent)?.title || ""}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>Filter the report data by date range and event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Time Frame</Label>
              <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Date Range</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedEvent("all");
              setTimeFrame("3months");
              handleTimeFrameChange("3months");
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset Filters
          </Button>
        </CardFooter>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Students registered in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {presentPercentage}% attendance rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
            <p className="text-xs text-muted-foreground">
              {latePercentage}% late rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {absentPercentage}% absence rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="bar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bar" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Event Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="pie" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Status Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="line" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span>Attendance Trends</span>
          </TabsTrigger>
        </TabsList>

        {/* Bar Chart - Event Attendance */}
        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Event Attendance</CardTitle>
              <CardDescription>Attendance breakdown by event</CardDescription>
            </CardHeader>
            <CardContent>
              {eventAttendanceData.length === 0 ? (
                <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="Present" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="Late" fill="hsl(var(--chart-2))" />
                      <Bar dataKey="Absent" fill="hsl(var(--chart-3))" />
                      <Bar dataKey="Excused" fill="hsl(var(--chart-4))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pie Chart - Status Distribution */}
        <TabsContent value="pie">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Status Distribution</CardTitle>
              <CardDescription>Overall attendance status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistributionData.every(item => item.value === 0) ? (
                <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Line Chart - Attendance Trends */}
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Attendance patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceTrendData.length === 0 ? (
                <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Present" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Late" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Absent" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Excused" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Attendance Summary</CardTitle>
          <CardDescription>Detailed attendance data by event</CardDescription>
        </CardHeader>
        <CardContent>
          {eventAttendanceData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Event</th>
                    <th className="py-3 px-4 text-center font-medium">Present</th>
                    <th className="py-3 px-4 text-center font-medium">Late</th>
                    <th className="py-3 px-4 text-center font-medium">Absent</th>
                    <th className="py-3 px-4 text-center font-medium">Excused</th>
                    <th className="py-3 px-4 text-center font-medium">Total</th>
                    <th className="py-3 px-4 text-center font-medium">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {eventAttendanceData.map((event, index) => {
                    const attendanceRate = event.Total > 0
                      ? Math.round(((event.Present + event.Late) / event.Total) * 100)
                      : 0;

                    return (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">{event.name}</td>
                        <td className="py-3 px-4 text-center">{event.Present}</td>
                        <td className="py-3 px-4 text-center">{event.Late}</td>
                        <td className="py-3 px-4 text-center">{event.Absent}</td>
                        <td className="py-3 px-4 text-center">{event.Excused}</td>
                        <td className="py-3 px-4 text-center">{event.Total}</td>
                        <td className="py-3 px-4 text-center">{attendanceRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
