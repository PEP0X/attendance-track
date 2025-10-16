import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VisitationRecorder } from "@/components/visitation/visitation-recorder"

export default async function VisitationPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">نظام الافتقاد</h2>
          <p className="text-gray-600 mt-1">تسجيل الافتقاد ومعرفة من افتقد من</p>
        </div>
        <VisitationRecorder />
      </div>
    </DashboardLayout>
  )
}


