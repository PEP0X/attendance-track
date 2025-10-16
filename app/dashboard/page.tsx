import { DashboardLayout } from "@/components/layout/dashboard-layout"
import dynamic from "next/dynamic"

const AttendanceRecorder = dynamic(
  () => import("@/components/attendance/attendance-recorder").then((m) => m.AttendanceRecorder),
  { loading: () => <div className="h-64 bg-gray-200 rounded animate-pulse" /> },
)

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">تسجيل الحضور</h2>
          <p className="text-gray-600 mt-1">سجل حضور وغياب الطلاب لاجتماع اليوم</p>
        </div>
        <AttendanceRecorder />
      </div>
    </DashboardLayout>
  )
}
