import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StudentManagement } from "@/components/students/student-management"

export default function StudentsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h2>
          <p className="text-gray-600 mt-1">إضافة وتعديل وحذف بيانات الطلاب</p>
        </div>
        <StudentManagement />
      </div>
    </DashboardLayout>
  )
}
