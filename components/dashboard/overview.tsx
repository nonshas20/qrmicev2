"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarCheck, Clock, Users, X, Check } from 'lucide-react';
import { AttendanceStats, Event } from '@/types';

interface DashboardOverviewProps {
  latestEvents: Event[];
  initialStats: AttendanceStats;
}

export function DashboardOverview({ latestEvents, initialStats }: DashboardOverviewProps) {
  const [stats, setStats] = useState<AttendanceStats>(initialStats);

  const pieData = [
    { name: 'Present', value: stats.present, color: 'hsl(var(--chart-1))' },
    { name: 'Late', value: stats.late, color: 'hsl(var(--chart-2))' },
    { name: 'Absent', value: stats.absent, color: 'hsl(var(--chart-3))' },
    { name: 'Excused', value: stats.excused, color: 'hsl(var(--chart-4))' },
  ];

  // Use real event attendance data or show zeros if no data available
  const barData = latestEvents.map(event => {
    const eventAttendance = event.attendance || { present: 0, late: 0, absent: 0, excused: 0 };
    return {
      name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
      Present: eventAttendance.present || 0,
      Late: eventAttendance.late || 0,
      Absent: eventAttendance.absent || 0,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Students registered in the system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present</CardTitle>
          <Check className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.present}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% attendance rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.late}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% late rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent</CardTitle>
          <X className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.absent}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% absence rate
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Student attendance status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  // Remove direct labels to prevent overlapping
                  label={false}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} (${Math.round((Number(value) / stats.total) * 100)}%)`, name]} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value, entry, index) => {
                    const percent = Math.round((pieData[index]?.value / stats.total) * 100) || 0;
                    return `${value}: ${pieData[index]?.value || 0} (${percent}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Recent Events Attendance</CardTitle>
          <CardDescription>Attendance for the latest events</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="hsl(var(--chart-1))" />
                <Bar dataKey="Late" fill="hsl(var(--chart-2))" />
                <Bar dataKey="Absent" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}