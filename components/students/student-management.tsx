"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Upload } from "lucide-react"
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
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Actions Bar - Sticky on Mobile */}
      <div className="sticky top-[88px] sm:top-[57px] lg:top-[57px] z-30 bg-gray-50 py-3 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-3">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة طالب
                </Button>
                <Button onClick={() => setBulkImportOpen(true)} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  استيراد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{members.length}</p>
            <p className="text-gray-600 mt-1">إجمالي الطلاب</p>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredMembers.map((member) => (
          <StudentCard key={member.id} member={member} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">لا توجد نتائج</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editingMember} onSave={handleSave} />
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} onImport={handleBulkImport} />
      </div>
    </div>
  )
}
