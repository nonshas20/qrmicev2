import { NextResponse } from 'next/server';
import { sendAttendanceConfirmation } from '@/lib/email';
import { Student } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student, eventTitle, timeIn, timeOut } = body;

    if (!student || !eventTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects if needed
    const timeInDate = timeIn ? new Date(timeIn) : null;
    const timeOutDate = timeOut ? new Date(timeOut) : null;

    // Send the email
    const result = await sendAttendanceConfirmation(
      student as Student,
      eventTitle,
      timeInDate,
      timeOutDate
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error in send-email API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
