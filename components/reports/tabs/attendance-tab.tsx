"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceRecord } from "../types";

const StudentAttendanceTable = dynamic(
  () => import("../student-attendance-table").then((m) => m.StudentAttendanceTable),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ),
  }
);

interface AttendanceTabProps {
  attendance: AttendanceRecord[];
  startDate: string;
  endDate: string;
  selectedStudent: string;
  students: { id: string; name: string }[];
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onStudentChange: (val: string) => void;
}

export function AttendanceTab({
  attendance,
  startDate,
  endDate,
  selectedStudent,
  students,
  onStartDateChange,
  onEndDateChange,
  onStudentChange,
}: AttendanceTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Filters */}
      <Card className="border-none shadow-sm bg-white text-right">
        <CardHeader className="pt-5 pb-6 border-b border-gray-50 mb-6 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg md:text-xl font-bold pt-1">تصفية السجلات</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">من تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="pl-9 h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">إلى تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="pl-9 h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">الطالب</Label>
              <Select value={selectedStudent} onValueChange={onStudentChange}>
                <SelectTrigger className="h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع الطلاب</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm text-right">
        <CardHeader className="pt-5 pb-6 border-b border-gray-50 mb-6 px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl font-bold">سجل الحضور التفصيلي</CardTitle>
          <CardDescription className="text-sm md:text-base mt-1.5">
            عرض وتحليل جميع سجلات الحضور والغياب المسجلة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <StudentAttendanceTable attendance={attendance} />
        </CardContent>
      </Card>
    </div>
  );
}

