import { DashboardLayout } from "@/components/layout/dashboard-layout"
import dynamic from "next/dynamic"

const ReportsAnalytics = dynamic(() => import("@/components/reports/reports-analytics").then(m => m.ReportsAnalytics), {
  loading: () => <div className="p-4 lg:p-6"><div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" /><div className="h-5 w-72 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-200 rounded animate-pulse" /></div>,
})

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h2>
          <p className="text-gray-600 mt-1">عرض وتحليل بيانات الحضور والغياب</p>
        </div>
        <ReportsAnalytics />
      </div>
    </DashboardLayout>
  )
}
