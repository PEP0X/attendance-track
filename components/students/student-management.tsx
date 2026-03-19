"use client"

import { useState, useEffect, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Upload, Users } from "lucide-react"
import { StudentDialog } from "./student-dialog"
import { BulkImportDialog } from "./bulk-import-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentsTable, type DeaconRank, type StudentMember, type StudentRow } from "./students-table"

export function StudentManagement() {
  const [members, setMembers] = useState<StudentMember[]>([])
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StudentMember | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setMembers((data || []) as StudentMember[])
      await loadAttendanceCounts()
    } catch (err) {
      console.error("Error loading members:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("member_id, status")
        .eq("status", "present")

      if (error) throw error

      const counts: Record<string, number> = {}
      ;(data || []).forEach((row: any) => {
        const id = row.member_id as string
        counts[id] = (counts[id] || 0) + 1
      })
      setAttendanceCounts(counts)
    } catch (err) {
      console.error("Error loading attendance counts:", err)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleEdit = (member: StudentMember) => {
    setEditingMember(member)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return

    try {
      const { error } = await supabase.from("members").delete().eq("id", id)

      if (error) throw error

      setMembers((prev) => prev.filter((m) => m.id !== id))
      setMessage({ type: "success", text: "تم حذف الطالب بنجاح" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حذف الطالب" })
    }
  }

  const handleSave = async (data: { name: string; phones: string[] | null; notes: string | null }) => {
    try {
      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from("members")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", editingMember.id)

        if (error) throw error

        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...data } : m)),
        )
        setMessage({ type: "success", text: "تم تحديث بيانات الطالب بنجاح" })
      } else {
        // Add new member
        const { data: newMember, error } = await supabase.from("members").insert([data]).select().single()

        if (error) throw error

        setMembers((prev) =>
          [...prev, newMember as StudentMember].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
        setMessage({ type: "success", text: "تم إضافة الطالب بنجاح" })
      }

      setDialogOpen(false)
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ بيانات الطالب" })
    }
  }

  const handleBulkImport = async (importedMembers: Omit<StudentMember, "id" | "deacon_rank">[]) => {
    try {
      const { data, error } = await supabase.from("members").insert(importedMembers).select()

      if (error) throw error

      setMembers((prev) =>
        [...prev, ...(data as StudentMember[])].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      )
      setMessage({ type: "success", text: `تم استيراد ${data.length} طالب بنجاح` })
      setBulkImportOpen(false)
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل استيراد البيانات" })
    }
  }

  const rows: StudentRow[] = useMemo(
    () =>
      members.map((member) => ({
        member,
        attendanceCount: attendanceCounts[member.id] || 0,
      })),
    [members, attendanceCounts],
  )

  const handleRankChange = async (id: string, rank: DeaconRank | null) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ deacon_rank: rank })
        .eq("id", id)

      if (error) throw error

      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, deacon_rank: rank } : m)),
      )
      setMessage({ type: "success", text: "تم تحديث الرتبة الشماسية بنجاح" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل تحديث الرتبة الشماسية" })
    }
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
    <div className="relative">
      {/* Modern Sticky Header */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-4">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-3 sm:p-4 text-center border border-blue-200 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg sm:p-2.5">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-blue-900">
                  {members.length}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-blue-700">
                  إجمالي الطلاب في الاجتماع
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-1">
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-md hover:shadow-lg transition-all h-11"
            >
              <Plus className="h-5 w-5 ml-1" />
              إضافة طالب
            </Button>
            <Button
              onClick={() => setBulkImportOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-md hover:shadow-lg transition-all h-11"
            >
              <Upload className="h-5 w-5 ml-1" />
              استيراد جماعي
            </Button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
          <AlertDescription className="font-medium">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Students Table */}
      <div className="max-w-6xl mx-auto pb-10">
        <StudentsTable
          rows={rows}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRankChange={handleRankChange}
        />
      </div>

      {/* Dialogs */}
      <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editingMember} onSave={handleSave} />
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} onImport={handleBulkImport} />
    </div>
  )
}
