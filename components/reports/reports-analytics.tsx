"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, TrendingUp, Users, CheckCircle2, XCircle, FileSpreadsheet, FileText } from "lucide-react"
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
      <Card className="border-2">
        <CardContent className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-4 font-medium">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative space-y-6">
      {/* Modern Filters Card - Sticky */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border-b-2 border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-bold text-gray-600">من تاريخ</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs font-bold text-gray-600">إلى تاريخ</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="student" className="text-xs font-bold text-gray-600">اختر الطالب</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student" className="h-10 border-2 border-gray-300 focus:border-blue-500">
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
        </div>
      </div>

      {/* Modern Stats Cards with Gradients */}
      <div className="max-w-6xl mx-auto grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-5">
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-100 to-blue-50 shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-blue-900">{stats.totalMeetings}</p>
                <p className="text-sm font-semibold text-blue-700">اجتماع</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-100 to-purple-50 shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-purple-900">{stats.totalStudents}</p>
                <p className="text-sm font-semibold text-purple-700">طالب</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-100 to-green-50 shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-green-900">{stats.averageAttendance}%</p>
                <p className="text-sm font-semibold text-green-700">متوسط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-900">{stats.totalPresent}</p>
                <p className="text-sm font-semibold text-emerald-700">حاضر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-300 bg-gradient-to-br from-rose-100 to-rose-50 shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600 rounded-xl shadow-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-rose-900">{stats.totalAbsent}</p>
                <p className="text-sm font-semibold text-rose-700">غائب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card className="max-w-6xl mx-auto border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
          <CardTitle className="text-xl font-black text-gray-900">📊 رسم بياني للحضور</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AttendanceChart attendance={attendance} />
        </CardContent>
      </Card>

      {/* Export Buttons Card */}
      <Card className="max-w-6xl mx-auto border-2 border-gray-200 shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleExport("pdf")} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <FileText className="h-4 w-4 ml-2" />
              تصدير PDF
            </Button>
            <Button 
              onClick={() => handleExport("excel")} 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button 
              onClick={() => handleExport("csv")} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="max-w-6xl mx-auto border-2 border-gray-200 shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
          <CardTitle className="text-xl font-black text-gray-900">📋 سجل الحضور التفصيلي</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <StudentAttendanceTable attendance={attendance} />
        </CardContent>
      </Card>
    </div>
  )
}
