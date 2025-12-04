import { DashboardLayout } from "@/components/layout/dashboard-layout"
import dynamic from "next/dynamic"
import { getMembers, getUsers } from "@/lib/data-service"

const AttendanceRecorder = dynamic(
  () => import("@/components/attendance/attendance-recorder").then((m) => m.AttendanceRecorder),
  { loading: () => <div className="h-96 bg-white/50 rounded-3xl animate-pulse border border-white/20 shadow-lg" /> },
)

export default async function DashboardPage() {
  const [members, users] = await Promise.all([getMembers(), getUsers()])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-20 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl"></div>
           
           <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">تسجيل الحضور</h2>
              <p className="text-blue-100 text-lg max-w-xl font-medium">
                قم بإدارة حضور وغياب الطلاب بكفاءة عالية.
              </p>
           </div>
        </div>
        
        <AttendanceRecorder initialMembers={members} usersList={users} />
      </div>
    </DashboardLayout>
  )
}
