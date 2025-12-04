"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Home, BarChart3, AlertTriangle, UserCheck } from "lucide-react";
import { AnalyticsHeader } from "./analytics-header";
import { AnalyticsStats } from "./analytics-stats";
import { OverviewTab } from "./tabs/overview-tab";
import { AttendanceTab } from "./tabs/attendance-tab";
import { RiskTab } from "./tabs/risk-tab";
import { AttendanceRecord, Stats, AtRiskStudent } from "./types";

export function ReportsAnalytics() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMeetings: 0,
    totalStudents: 0,
    averageAttendance: 0,
    totalPresent: 0,
    totalAbsent: 0,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);

    loadStudents();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadAttendance();
    }
  }, [startDate, endDate, selectedStudent]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error("Error loading students:", err);
    }
  };

  const loadAttendance = async () => {
    setRefreshing(true);
    if (attendance.length === 0) setLoading(true);

    try {
      let query = supabase
        .from("attendance")
        .select(
          `
          *,
          member:members(name)
        `
        )
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (selectedStudent !== "all") {
        query = query.eq("member_id", selectedStudent);
      }

      const { data, error } = await query;

      if (error) throw error;

      const attendanceData = (data || []).map((record: any) => ({
        ...record,
        member: { name: record.member.name },
      }));

      setAttendance(attendanceData);
      calculateStats(attendanceData);
      calculateAtRisk(attendanceData);
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: AttendanceRecord[]) => {
    const uniqueDates = new Set(data.map((r) => r.date));
    const uniqueMembers = new Set(data.map((r) => r.member_id));
    const presentCount = data.filter((r) => r.status === "present").length;
    const absentCount = data.filter((r) => r.status === "absent").length;
    const totalRecords = data.length;

    setStats({
      totalMeetings: uniqueDates.size,
      totalStudents: uniqueMembers.size,
      averageAttendance:
        totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      totalPresent: presentCount,
      totalAbsent: absentCount,
    });
  };

  const calculateAtRisk = (data: AttendanceRecord[]) => {
    const studentRecords: Record<
      string,
      { name: string; records: AttendanceRecord[] }
    > = {};
    data.forEach((record) => {
      if (!studentRecords[record.member_id]) {
        studentRecords[record.member_id] = {
          name: record.member.name,
          records: [],
        };
      }
      studentRecords[record.member_id].records.push(record);
    });

    const riskList: AtRiskStudent[] = [];

    Object.entries(studentRecords).forEach(([id, { name, records }]) => {
      const sortedRecords = records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let consecutiveAbsences = 0;
      for (let i = 0; i < Math.min(sortedRecords.length, 3); i++) {
        if (sortedRecords[i].status === "absent") {
          consecutiveAbsences++;
        } else {
          break;
        }
      }

      if (consecutiveAbsences >= 2) {
        const lastPresent = sortedRecords.find((r) => r.status === "present");
        riskList.push({
          id,
          name,
          absentCount: consecutiveAbsences,
          lastAttendance: lastPresent ? lastPresent.date : null,
        });
      }
    });

    setAtRiskStudents(riskList);
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    const data = attendance.map((record) => ({
      التاريخ: record.date,
      الطالب: record.member.name,
      الحالة: record.status === "present" ? "حاضر" : "غائب",
      الملاحظات: record.notes || "-",
    }));

    const { exportToPDF, exportToExcel, exportToCSV } = await import(
      "@/lib/export-utils"
    );
    if (format === "pdf") exportToPDF(data, "تقرير الحضور");
    if (format === "excel") exportToExcel(data, "تقرير الحضور");
    if (format === "csv") exportToCSV(data, "تقرير الحضور");
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-8 w-full" dir="rtl">
      <AnalyticsHeader
        loading={loading}
        refreshing={refreshing}
        onRefresh={loadAttendance}
        onExport={handleExport}
      />

      <Tabs defaultValue="overview" className="w-full space-y-6" dir="rtl">
        {/* Scrollable Tabs Container */}
        <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 space-x-6 space-x-reverse inline-flex min-w-max">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 whitespace-nowrap flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 whitespace-nowrap flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>تقارير الحضور</span>
            </TabsTrigger>
            <TabsTrigger
              value="risk"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 whitespace-nowrap flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>طلاب تحت الملاحظة</span>
              {atRiskStudents.length > 0 && (
                <Badge
                  variant="destructive"
                  className="rounded-full px-2 py-0.5 text-[10px]"
                >
                  {atRiskStudents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="visitation"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 whitespace-nowrap flex items-center gap-2"
              disabled
            >
              <UserCheck className="h-4 w-4" />
              <span>الافتقاد والمتابعة (قريباً)</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="space-y-6 md:space-y-8">
            <AnalyticsStats
              stats={stats}
              atRiskCount={atRiskStudents.length}
              loading={loading}
            />
            <OverviewTab
              attendance={attendance}
              stats={stats}
              loading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab
            attendance={attendance}
            startDate={startDate}
            endDate={endDate}
            selectedStudent={selectedStudent}
            students={students}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onStudentChange={setSelectedStudent}
          />
        </TabsContent>

        <TabsContent value="risk">
          <RiskTab atRiskStudents={atRiskStudents} />
        </TabsContent>

        <TabsContent value="visitation">
          {/* Future Implementation */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
