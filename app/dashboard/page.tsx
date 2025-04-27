import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Event, AttendanceStats } from '@/types';

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch events from Supabase
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(5);

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
  }

  // Fetch all attendance records
  const { data: attendanceData, error: statsError } = await supabase
    .from('attendance')
    .select('status, event_id');

  if (statsError) {
    console.error('Error fetching attendance stats:', statsError);
  }

  // Calculate overall attendance statistics
  const stats: AttendanceStats = {
    total: attendanceData?.length || 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  };

  // Process attendance data
  if (attendanceData && attendanceData.length > 0) {
    // Count each status type for overall stats
    attendanceData.forEach(record => {
      switch (record.status) {
        case 'present':
          stats.present++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'excused':
          stats.excused++;
          break;
      }
    });
  }

  // Add attendance data to each event
  const events = eventsData?.map(event => {
    // Filter attendance records for this event
    const eventAttendance = attendanceData?.filter(record => record.event_id === event.id) || [];

    // Count attendance by status for this event
    const eventStats = {
      total: eventAttendance.length,
      present: eventAttendance.filter(record => record.status === 'present').length,
      late: eventAttendance.filter(record => record.status === 'late').length,
      absent: eventAttendance.filter(record => record.status === 'absent').length,
      excused: eventAttendance.filter(record => record.status === 'excused').length
    };

    // Return event with attendance data
    return {
      ...event,
      attendance: eventStats
    };
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4">
        <div>
          <h3 className="text-lg font-medium">Overview</h3>
          <DashboardOverview latestEvents={events} initialStats={stats} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Recent Events</h3>
          <RecentEvents events={events} />
        </div>
      </div>
    </div>
  );
}

import { DashboardOverview } from "@/components/dashboard/overview";
import { RecentEvents } from "@/components/dashboard/recent-events";