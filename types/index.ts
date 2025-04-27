export interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attendance?: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  };
}

export interface Attendance {
  id: string;
  student_id: string;
  event_id: string;
  time_in: string | null;
  time_out: string | null;
  status: 'present' | 'late' | 'absent' | 'excused';
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'secretary';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface StudentWithAttendance extends Student {
  attendance?: Attendance;
}

export interface AttendanceWithStudent extends Attendance {
  student: Student;
}

export interface QRData {
  studentId: string;
  name: string;
  email: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
}