import { DashboardLayout } from "@/components/layout/dashboard-layout"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ReportsAnalytics = dynamic(() => import("@/components/reports/reports-analytics").then(m => m.ReportsAnalytics), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-5">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  ),
})

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <ReportsAnalytics />
      </div>
    </DashboardLayout>
  )
}
