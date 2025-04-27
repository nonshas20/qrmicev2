import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Event, AttendanceStats } from '@/types';

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch events from Supabase
  const { data: events, error: eventsError } = await supabase
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
    .select('status');

  if (statsError) {
    console.error('Error fetching attendance stats:', statsError);
  }

  // Calculate attendance statistics manually
  const stats: AttendanceStats = {
    total: attendanceData?.length || 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  };

  if (attendanceData && attendanceData.length > 0) {
    // Count each status type
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
  } else {
    // If no data, provide some default stats for demonstration
    stats.present = 0;
    stats.late = 0;
    stats.absent = 0;
    stats.excused = 0;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4">
        <div>
          <h3 className="text-lg font-medium">Overview</h3>
          <DashboardOverview latestEvents={events || []} initialStats={stats} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Recent Events</h3>
          <RecentEvents events={events || []} />
        </div>
      </div>
    </div>
  );
}

import { DashboardOverview } from "@/components/dashboard/overview";
import { RecentEvents } from "@/components/dashboard/recent-events";