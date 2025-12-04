import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VisitationRecorder } from "@/components/visitation/visitation-recorder"
import { getMembers, getUsers, getAssignments } from "@/lib/data-service"
import dynamic from "next/dynamic"

const DynamicVisitationRecorder = dynamic(
  () => import("@/components/visitation/visitation-recorder").then((m) => m.VisitationRecorder),
  { loading: () => <div className="h-96 bg-white/50 rounded-3xl animate-pulse border border-white/20 shadow-lg" /> },
)

export default async function VisitationPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [members, users, assignments] = await Promise.all([
    getMembers(),
    getUsers(),
    getAssignments(),
  ])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-20 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl"></div>
           
           <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">نظام الافتقاد</h2>
              <p className="text-emerald-100 text-lg max-w-xl font-medium">
                تابع افتقاد الطلاب وتواصل معهم بفعالية.
              </p>
           </div>
        </div>
        <DynamicVisitationRecorder 
          initialMembers={members} 
          usersList={users} 
          initialAssignments={assignments} 
        />
      </div>
    </DashboardLayout>
  )
}
