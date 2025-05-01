"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Event } from "@/types";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters",
  }),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  start_time: z.string({
    required_error: "Start time is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  end_time: z.string({
    required_error: "End time is required",
  }),
}).refine((data) => {
  const startDateTime = new Date(
    `${format(data.start_date, "yyyy-MM-dd")}T${data.start_time}`
  );
  const endDateTime = new Date(
    `${format(data.end_date, "yyyy-MM-dd")}T${data.end_time}`
  );
  return endDateTime > startDateTime;
}, {
  message: "End date/time must be after start date/time",
  path: ["end_date"],
});

interface EventFormProps {
  event?: Event;
  isEditing?: boolean;
}

export function EventForm({ event, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Fetch the current user
  useEffect(() => {
    async function getUser() {
      setIsUserLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        } else {
          setError("You must be logged in to create an event");
        }
      } catch (error: any) {
        setError("Failed to get user information: " + error.message);
      } finally {
        setIsUserLoading(false);
      }
    }

    getUser();
  }, []);

  // Generate time options for select dropdown (every 30 minutes)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const formattedHour = hour.toString().padStart(2, "0");

    // Create the 24-hour format value (for internal use)
    const value = `${formattedHour}:${minute}`;

    // Create the 12-hour format label (for display)
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? "PM" : "AM";
    const label = `${hour12}:${minute} ${period}`;

    return { value, label };
  });

  // Parse existing event dates if editing
  let defaultStartDate: Date | undefined;
  let defaultEndDate: Date | undefined;
  let defaultStartTime: string = "09:00";
  let defaultEndTime: string = "17:00";

  if (isEditing && event) {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    defaultStartDate = startDate;
    defaultEndDate = endDate;
    defaultStartTime = format(startDate, "HH:mm");
    defaultEndTime = format(endDate, "HH:mm");
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      start_date: defaultStartDate,
      start_time: defaultStartTime,
      end_date: defaultEndDate,
      end_time: defaultEndTime,
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    if (!user && !isEditing) {
      setError("You must be logged in to create an event");
      setIsLoading(false);
      return;
    }

    try {
      // Combine date and time into ISO strings
      const startDateTime = new Date(
        `${format(values.start_date, "yyyy-MM-dd")}T${values.start_time}:00`
      ).toISOString();

      const endDateTime = new Date(
        `${format(values.end_date, "yyyy-MM-dd")}T${values.end_time}:00`
      ).toISOString();

      if (isEditing && event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: values.title,
            description: values.description || null,
            location: values.location || null,
            start_date: startDateTime,
            end_date: endDateTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        if (error) throw error;
      } else {
        // Create new event with the current user's ID
        const { error } = await supabase
          .from('events')
          .insert({
            title: values.title,
            description: values.description || null,
            location: values.location || null,
            start_date: startDateTime,
            end_date: endDateTime,
            created_by: user!.id, // Add the user ID
          });

        if (error) throw error;
      }

      router.push('/dashboard/events');
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Failed to save event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Event" : "Add New Event"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the event details"
            : "Enter the details to create a new event"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUserLoading ? (
          <div className="flex justify-center p-6">
            <p>Loading user information...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="e.g., Annual Conference"
                {...register("title")}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description"
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Conference Hall"
                {...register("location")}
                disabled={isLoading}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setValue("start_date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      onValueChange={(value) => setValue("start_time", value)}
                      defaultValue={defaultStartTime}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <p className="text-sm text-muted-foreground mb-2">Common times</p>
                          {timeOptions.filter((t, i) => i % 4 === 0 || t.value === "12:00" || t.value === "12:30").map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </div>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">All times</p>
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[140px]">
                    <Input
                      type="time"
                      onChange={(e) => {
                        if (e.target.value) {
                          setValue("start_time", e.target.value);
                        }
                      }}
                      defaultValue={defaultStartTime}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {errors.start_time && (
                  <p className="text-sm text-destructive">{errors.start_time.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Select from dropdown or enter a custom time
                </p>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setValue("end_date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      onValueChange={(value) => setValue("end_time", value)}
                      defaultValue={defaultEndTime}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <p className="text-sm text-muted-foreground mb-2">Common times</p>
                          {timeOptions.filter((t, i) => i % 4 === 0 || t.value === "12:00" || t.value === "12:30" || t.value === "17:00" || t.value === "17:30").map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </div>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">All times</p>
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[140px]">
                    <Input
                      type="time"
                      onChange={(e) => {
                        if (e.target.value) {
                          setValue("end_time", e.target.value);
                        }
                      }}
                      defaultValue={defaultEndTime}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {errors.end_time && (
                  <p className="text-sm text-destructive">{errors.end_time.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Select from dropdown or enter a custom time
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Saving..." : isEditing ? "Update Event" : "Add Event"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
