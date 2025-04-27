"use server";

import nodemailer from 'nodemailer';
import { Student } from '@/types';

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAttendanceConfirmation(
  student: Student,
  eventTitle: string,
  timeIn: Date | null = null,
  timeOut: Date | null = null
) {
  try {
    let subject, textContent, htmlContent;

    if (timeIn && !timeOut) {
      // Time-in confirmation
      subject = `Attendance Recorded: ${eventTitle}`;
      textContent = `Hello ${student.name},\n\nYour attendance has been recorded for ${eventTitle}.\n\nTime-in: ${timeIn.toLocaleString()}\n\nThank you.`;
      htmlContent = `
        <h2>Attendance Confirmation</h2>
        <p>Hello ${student.name},</p>
        <p>Your attendance has been recorded for <strong>${eventTitle}</strong>.</p>
        <p><strong>Time-in:</strong> ${timeIn.toLocaleString()}</p>
        <p>Thank you for your participation.</p>
      `;
    } else if (timeIn && timeOut) {
      // Time-out confirmation
      subject = `Attendance Complete: ${eventTitle}`;
      textContent = `Hello ${student.name},\n\nYour attendance record has been completed for ${eventTitle}.\n\nTime-in: ${timeIn.toLocaleString()}\nTime-out: ${timeOut.toLocaleString()}\n\nThank you.`;
      htmlContent = `
        <h2>Attendance Complete</h2>
        <p>Hello ${student.name},</p>
        <p>Your attendance record has been completed for <strong>${eventTitle}</strong>.</p>
        <p><strong>Time-in:</strong> ${timeIn.toLocaleString()}</p>
        <p><strong>Time-out:</strong> ${timeOut.toLocaleString()}</p>
        <p>Thank you for your participation.</p>
      `;
    } else {
      throw new Error('Invalid attendance data for email notification');
    }

    const mailOptions = {
      from: `"MICE Attendance System" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}