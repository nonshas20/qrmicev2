import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Add New Event</h2>
      </div>
      
      <EventForm />
    </div>
  );
}
