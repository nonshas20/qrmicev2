import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface RecentEventsProps {
  events: Event[];
}

export function RecentEvents({ events }: RecentEventsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest events in the system</CardDescription>
        </div>
        <Calendar className="ml-auto h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {events.length === 0 ? (
            <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No events found</p>
            </div>
          ) : (
            events.map((event) => {
              const startDate = new Date(event.start_date);
              const isUpcoming = startDate > new Date();
              const relativeTime = formatDistanceToNow(startDate, { addSuffix: true });
              
              return (
                <div key={event.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.location || 'No location specified'}
                    </p>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <Badge variant={isUpcoming ? "outline" : "secondary"}>
                      {isUpcoming ? 'Upcoming' : 'Past'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{relativeTime}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}