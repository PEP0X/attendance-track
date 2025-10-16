"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Upload, Users } from "lucide-react"
import { StudentDialog } from "./student-dialog"
import { StudentCard } from "./student-card"
import { BulkImportDialog } from "./bulk-import-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
}

export function StudentManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").order("name", { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error("Error loading members:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleEdit = (member: Member) => {
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

        setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? { ...m, ...data } : m)))
        setMessage({ type: "success", text: "تم تحديث بيانات الطالب بنجاح" })
      } else {
        // Add new member
        const { data: newMember, error } = await supabase.from("members").insert([data]).select().single()

        if (error) throw error

        setMembers((prev) => [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name)))
        setMessage({ type: "success", text: "تم إضافة الطالب بنجاح" })
      }

      setDialogOpen(false)
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ بيانات الطالب" })
    }
  }

  const handleBulkImport = async (importedMembers: Omit<Member, "id">[]) => {
    try {
      const { data, error } = await supabase.from("members").insert(importedMembers).select()

      if (error) throw error

      setMembers((prev) => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name)))
      setMessage({ type: "success", text: `تم استيراد ${data.length} طالب بنجاح` })
      setBulkImportOpen(false)
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل استيراد البيانات" })
    }
  }

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border-b-2 border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 text-center border-2 border-blue-300 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-blue-900">{members.length}</p>
                <p className="text-sm font-semibold text-blue-700">إجمالي الطلاب</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="🔍 ابحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
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

      {/* Students Grid */}
      <div className="max-w-6xl mx-auto grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 pb-8 px-0">
        {filteredMembers.length === 0 && (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold text-lg">لا توجد نتائج</p>
                <p className="text-sm text-gray-400 mt-1">جرب البحث بكلمات أخرى أو أضف طالب جديد</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {filteredMembers.map((member) => (
          <StudentCard key={member.id} member={member} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Dialogs */}
      <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editingMember} onSave={handleSave} />
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} onImport={handleBulkImport} />
    </div>
  )
}
