export interface AttendanceRecord {
  id: string;
  member_id: string;
  date: string;
  status: string;
  notes: string | null;
  member: {
    name: string;
  };
}

export interface Stats {
  totalMeetings: number;
  totalStudents: number;
  averageAttendance: number;
  totalPresent: number;
  totalAbsent: number;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  absentCount: number;
  lastAttendance: string | null;
}

