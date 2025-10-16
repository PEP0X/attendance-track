"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
const AttendanceChart = dynamic(() => import("./attendance-chart").then(m => m.AttendanceChart), { ssr: false })
const StudentAttendanceTable = dynamic(() => import("./student-attendance-table").then(m => m.StudentAttendanceTable), { ssr: false })

interface AttendanceRecord {
  id: string
  member_id: string
  date: string
  status: string
  notes: string | null
  member: {
    name: string
  }
}

interface Stats {
  totalMeetings: number
  totalStudents: number
  averageAttendance: number
  totalPresent: number
  totalAbsent: number
}

export function ReportsAnalytics() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMeetings: 0,
    totalStudents: 0,
    averageAttendance: 0,
    totalPresent: 0,
    totalAbsent: 0,
  })
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // Set default date range (last 3 months)
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 3)
    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])

    loadStudents()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadAttendance()
    }
  }, [startDate, endDate, selectedStudent])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase.from("members").select("id, name").order("name", { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error("Error loading students:", err)
    }
  }

  const loadAttendance = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("attendance")
        .select(
          `
          *,
          member:members(name)
        `,
        )
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })

      if (selectedStudent !== "all") {
        query = query.eq("member_id", selectedStudent)
      }

      const { data, error } = await query

      if (error) throw error

      const attendanceData = (data || []).map((record: any) => ({
        ...record,
        member: { name: record.member.name },
      }))

      setAttendance(attendanceData)
      calculateStats(attendanceData)
    } catch (err) {
      console.error("Error loading attendance:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: AttendanceRecord[]) => {
    const uniqueDates = new Set(data.map((r) => r.date))
    const uniqueMembers = new Set(data.map((r) => r.member_id))
    const presentCount = data.filter((r) => r.status === "present").length
    const absentCount = data.filter((r) => r.status === "absent").length
    const totalRecords = data.length

    setStats({
      totalMeetings: uniqueDates.size,
      totalStudents: uniqueMembers.size,
      averageAttendance: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      totalPresent: presentCount,
      totalAbsent: absentCount,
    })
  }

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    const data = attendance.map((record) => ({
      التاريخ: record.date,
      الطالب: record.member.name,
      الحالة: record.status === "present" ? "حاضر" : "غائب",
      الملاحظات: record.notes || "-",
    }))

    const { exportToPDF, exportToExcel, exportToCSV } = await import("@/lib/export-utils")
    if (format === "pdf") exportToPDF(data, "تقرير الحضور")
    if (format === "excel") exportToExcel(data, "تقرير الحضور")
    if (format === "csv") exportToCSV(data, "تقرير الحضور")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student">الطالب</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMeetings}</p>
                <p className="text-sm text-gray-600">اجتماع</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">طالب</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</p>
                <p className="text-sm text-gray-600">متوسط الحضور</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPresent}</p>
                <p className="text-sm text-gray-600">حاضر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAbsent}</p>
                <p className="text-sm text-gray-600">غائب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>رسم بياني للحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceChart attendance={attendance} />
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleExport("pdf")} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير PDF
            </Button>
            <Button onClick={() => handleExport("excel")} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button onClick={() => handleExport("csv")} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الحضور التفصيلي</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentAttendanceTable attendance={attendance} />
        </CardContent>
      </Card>
    </div>
  )
}
