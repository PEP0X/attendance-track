"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Home, BarChart3, AlertTriangle, UserCheck, FileText, FileSpreadsheet } from "lucide-react";
import { AnalyticsHeader } from "./analytics-header";
import { AnalyticsStats } from "./analytics-stats";
import { OverviewTab } from "./tabs/overview-tab";
import { AttendanceTab } from "./tabs/attendance-tab";
import { RiskTab } from "./tabs/risk-tab";
import { AttendanceRecord, Stats, AtRiskStudent } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

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

  const [nonDeacons, setNonDeacons] = useState<
    { id: string; name: string; phones: string[] | null; notes: string | null }[]
  >([]);
  const [nonDeaconsLoading, setNonDeaconsLoading] = useState(false);
  const [nonDeaconsSearch, setNonDeaconsSearch] = useState("");
  const nonDeaconsFiltered = nonDeacons.filter((m) => {
    const q = nonDeaconsSearch.trim().toLowerCase();
    if (!q) return true;
    const phonesText = (m.phones ?? []).join(" ").toLowerCase();
    const notesText = (m.notes ?? "").toLowerCase();
    return m.name.toLowerCase().includes(q) || phonesText.includes(q) || notesText.includes(q);
  });

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

  const handleExtractNonDeacons = async () => {
    setNonDeaconsLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, phones, notes, deacon_rank")
        .eq("deacon_rank", "not_deacon")
        .order("name", { ascending: true });

      if (error) throw error;

      setNonDeacons(
        (data || []).map((m: any) => ({
          id: m.id as string,
          name: m.name as string,
          phones: (m.phones as string[] | null) ?? null,
          notes: (m.notes as string | null) ?? null,
        })),
      );
    } catch (err) {
      console.error("Error extracting non-deacons:", err);
    } finally {
      setNonDeaconsLoading(false);
    }
  };

  const handleExportNonDeacons = async (format: "pdf" | "excel") => {
    if (nonDeacons.length === 0) return;

    const data = nonDeacons.map((m) => ({
      الاسم: m.name,
      "أرقام التليفون": (m.phones ?? []).length ? (m.phones ?? []).join(", ") : "-",
      الملاحظات: m.notes ?? "-",
    }));

    const title = "أسماء الشمامسة غير المرشومين بالمستوي الثاني رابعة وخامسة وسادسة ابتدائي";
    if (format === "pdf") exportToPDF(data, title);
    if (format === "excel") exportToExcel(data, title);
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

      <Card className="border-none shadow-sm bg-white text-right">
        <CardHeader className="pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div className="space-y-1">
              <CardTitle className="text-lg md:text-xl font-bold">
                أسماء الشمامسة غير المرشومين بالمستوي الثاني رابعة وخامسة وسادسة ابتدائي
              </CardTitle>
              <CardDescription>
                استخراج وعرض كل الطلاب “مش شماس” ثم تصدير PDF أو Excel.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleExtractNonDeacons}
                disabled={nonDeaconsLoading}
                className="h-10"
              >
                {nonDeaconsLoading ? "جاري الاستخراج..." : "استخراج"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExportNonDeacons("excel")}
                disabled={nonDeacons.length === 0}
                className="h-10"
              >
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                Excel
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExportNonDeacons("pdf")}
                disabled={nonDeacons.length === 0}
                className="h-10"
              >
                <FileText className="h-4 w-4 ml-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row mb-4">
            <div className="text-sm text-gray-500">
              {nonDeaconsLoading ? "..." : `${nonDeaconsFiltered.length} طالب`}
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="بحث بالاسم أو الهاتف أو الملاحظات..."
                value={nonDeaconsSearch}
                onChange={(e) => setNonDeaconsSearch(e.target.value)}
                className="bg-gray-50"
              />
            </div>
          </div>

          {nonDeaconsLoading ? (
            <div className="py-10 text-center text-gray-500">جاري التحميل...</div>
          ) : nonDeaconsFiltered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              لا توجد بيانات بعد. اضغط زر “استخراج”.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-l from-indigo-50 to-blue-50">
                  <TableRow>
                    <TableHead className="text-right whitespace-nowrap">الاسم</TableHead>
                    <TableHead className="text-right whitespace-nowrap">أرقام التليفون</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonDeaconsFiltered.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {(m.phones ?? []).length ? (m.phones ?? []).join(", ") : "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">{m.notes ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
