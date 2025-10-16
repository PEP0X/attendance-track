"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, Search, Calendar, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
}

interface AttendanceRecord {
  member_id: string
  status: "present" | "absent"
  notes: string
  recorded_by?: string | null
  created_at?: string | null
}

export function AttendanceRecorder() {
  const [members, setMembers] = useState<Member[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const hasUnsavedChangesRef = useRef(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    loadMembers()
    loadUsers()
    loadAttendance()
  }, [selectedDate])

  // Load current user id for suppressing self toasts
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (mounted) setCurrentUserId(data.user?.id ?? null)
      } catch {
        if (mounted) setCurrentUserId(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  // Realtime subscriptions for attendance (by selected date) and members
  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`realtime-attendance-${selectedDate}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${selectedDate}` },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const rec = payload.new as {
              member_id: string
              status: 'present' | 'absent'
              notes?: string | null
              date: string
              recorded_by?: string | null
              created_at?: string | null
            }
            setAttendance((prev) => ({
              ...prev,
              [rec.member_id]: {
                member_id: rec.member_id,
                status: rec.status,
                notes: rec.notes || '',
                recorded_by: rec.recorded_by ?? null,
                created_at: rec.created_at ?? null,
              },
            }))
            // Toast for changes made by others
            const isSelfChange = rec.recorded_by && currentUserId && rec.recorded_by === currentUserId
            if (!isSelfChange) {
              const memberName = members.find((m) => m.id === rec.member_id)?.name || 'طالب'
              const who = users.find((u) => u.id === rec.recorded_by)?.name || 'مستخدم'
              toast({ description: `${memberName}: ${rec.status === 'present' ? 'حاضر' : 'غائب'} — بواسطة ${who}` })
            }
          } else if (eventType === 'DELETE') {
            const oldRec = payload.old as { member_id: string; date: string }
            setAttendance((prev) => {
              const next = { ...prev }
              delete next[oldRec.member_id]
              return next
            })
            const memberName = members.find((m) => m.id === oldRec.member_id)?.name || 'طالب'
            toast({ description: `تم إزالة سجل الحضور لـ ${memberName}` })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          if (eventType === 'INSERT') {
            const m = payload.new as Member
            setMembers((prev) =>
              [...prev, m].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
            )
            toast({ description: `تم إضافة طالب جديد: ${m.name}` })
          } else if (eventType === 'UPDATE') {
            const m = payload.new as Member
            setMembers((prev) =>
              prev
                .map((x) => (x.id === m.id ? m : x))
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
            )
            toast({ description: `تم تحديث بيانات الطالب: ${m.name}` })
          } else if (eventType === 'DELETE') {
            const m = payload.old as { id: string }
            setMembers((prev) => prev.filter((x) => x.id !== m.id))
            setAttendance((prev) => {
              const next = { ...prev }
              delete next[m.id]
              return next
            })
            toast({ description: `تم حذف طالب` })
          }
        },
      )
      .subscribe()

    return () => {
      // Cleanup on date change/unmount
      supabase.removeChannel(channel)
    }
  }, [selectedDate, supabase, currentUserId, members, toast])

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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id,name")
      if (error) throw error
      setUsers((data || []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
    } catch (err) {
      // Non-fatal if users cannot be loaded; names will fallback to ids
      console.error("Error loading users:", err)
    }
  }

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase.from("attendance").select("*").eq("date", selectedDate)

      if (error) throw error

      const attendanceMap: Record<string, AttendanceRecord> = {}
      data?.forEach((record: { member_id: string; status: "present" | "absent"; notes?: string | null; recorded_by?: string | null; created_at?: string | null }) => {
        attendanceMap[record.member_id] = {
          member_id: record.member_id,
          status: record.status,
          notes: record.notes || "",
          recorded_by: record.recorded_by ?? null,
          created_at: record.created_at ?? null,
        }
      })
      setAttendance(attendanceMap)
    } catch (err) {
      console.error("Error loading attendance:", err)
    }
  }

  const toggleAttendance = async (memberId: string, status: "present" | "absent") => {
    // Optimistic local update
    setAttendance((prev) => ({
      ...prev,
      [memberId]: {
        member_id: memberId,
        status,
        notes: prev[memberId]?.notes || "",
        recorded_by: currentUserId ?? prev[memberId]?.recorded_by ?? null,
      },
    }))

    // Persist immediately with recorded_by set to the actor
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const actorId = user?.id ?? null

      const payload = {
        member_id: memberId,
        date: selectedDate,
        status,
        notes: attendance[memberId]?.notes || null,
        recorded_by: actorId,
      }

      const { error } = await supabase
        .from("attendance")
        .upsert(payload, { onConflict: "member_id,date" })
      if (error) throw error
      hasUnsavedChangesRef.current = false
    } catch (err) {
      // Revert optimistic change on failure
      setAttendance((prev) => ({ ...prev }))
    }
  }

  const updateNotes = (memberId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        member_id: memberId,
        status: prev[memberId]?.status || "absent",
        notes,
      },
    }))
    hasUnsavedChangesRef.current = true
  }

  const saveAttendance = async () => {
    if (Object.keys(attendance).length === 0) return
    const proceed = window.confirm("سيتم استبدال سجلات هذا التاريخ. هل تريد المتابعة؟")
    if (!proceed) return
    setSaving(true)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      // Upsert attendance records atomically to avoid race conditions
      const records = Object.values(attendance).map((record) => ({
        member_id: record.member_id,
        date: selectedDate,
        status: record.status,
        notes: record.notes || null,
      }))

      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "member_id,date" })

      if (error) throw error

      setMessage({ type: "success", text: "تم حفظ الحضور بنجاح" })
      hasUnsavedChangesRef.current = false
      toast({ description: "تم الحفظ" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ الحضور" })
    } finally {
      setSaving(false)
    }
  }

  const filteredMembers = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [members, searchQuery],
  )

  // Bulk actions operate on filtered set
  const bulkMark = (status: "present" | "absent") => {
    if (filteredMembers.length === 0) return
    setAttendance((prev) => {
      const next = { ...prev }
      filteredMembers.forEach((m) => {
        next[m.id] = { member_id: m.id, status, notes: next[m.id]?.notes || "" }
      })
      return next
    })
    hasUnsavedChangesRef.current = true
  }
  const bulkReset = () => {
    if (filteredMembers.length === 0) return
    setAttendance((prev) => {
      const next = { ...prev }
      filteredMembers.forEach((m) => {
        delete next[m.id]
      })
      return next
    })
    hasUnsavedChangesRef.current = true
  }

  // Mark only currently unselected (no record) filtered members as absent
  const markUnselectedAsAbsent = () => {
    if (filteredMembers.length === 0) return
    setAttendance((prev) => {
      const next = { ...prev }
      filteredMembers.forEach((m) => {
        if (!next[m.id]) {
          next[m.id] = { member_id: m.id, status: "absent", notes: "" }
        }
      })
      return next
    })
    hasUnsavedChangesRef.current = true
  }

  // Confirm leaving with unsaved changes
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s"
      if (isSave) {
        e.preventDefault()
        if (!saving && Object.keys(attendance).length > 0) {
          void saveAttendance()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [saving, attendance])

  const stats = {
    total: members.length,
    present: Object.values(attendance).filter((a) => a.status === "present").length,
    absent: Object.values(attendance).filter((a) => a.status === "absent").length,
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Date Selection and Stats */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Date Picker */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="date" className="text-sm text-gray-600">
                  تاريخ الاجتماع
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
            </div>

            {/* Stats - Responsive Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs sm:text-sm text-gray-600">إجمالي الطلاب</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-xs sm:text-sm text-gray-600">حاضر</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-xs sm:text-sm text-gray-600">غائب</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search + Bulk actions - Sticky on Mobile */}
      <div className="sticky top-[88px] sm:top-[57px] lg:top-[57px] z-30 bg-gray-50 py-3 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-3">
        <Card className="shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن طالب..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => bulkMark("present")}>
                كله حاضر
              </Button>
              <Button variant="outline" size="sm" onClick={() => bulkMark("absent")}>
                  كله غائب
              </Button>
              <Button variant="outline" size="sm" onClick={bulkReset}>
                إعادة التعيين للكل
              </Button>
              <Button variant="outline" size="sm" onClick={markUnselectedAsAbsent}>
  الباقي غائبين
              </Button>
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

      {/* Attendance List */}
      <div className="grid gap-4">
        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">لا توجد نتائج مطابقة لبحثك.</p>
            </CardContent>
          </Card>
        )}
        {filteredMembers.map((member) => {
          const record = attendance[member.id]
          const isPresent = record?.status === "present"
          const isAbsent = record?.status === "absent"

          return (
            <Card key={member.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 break-words">{member.name}</h3>
                      {member.phones && member.phones.length > 0 && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 break-all">{member.phones.join(" · ")}</p>
                      )}
                      {member.notes && <p className="text-xs sm:text-sm text-gray-500 mt-1">{member.notes}</p>}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant={isPresent ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAttendance(member.id, "present")}
                        className={cn("gap-1 sm:gap-2 flex-1 sm:flex-initial", isPresent && "bg-green-600 hover:bg-green-700")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">حاضر</span>
                      </Button>
                      <Button
                        variant={isAbsent ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAttendance(member.id, "absent")}
                        className={cn("gap-1 sm:gap-2 flex-1 sm:flex-initial", isAbsent && "bg-red-600 hover:bg-red-700")}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">غائب</span>
                      </Button>
                    </div>
                  </div>

                  {record && (
                    <div>
                      <Label htmlFor={`notes-${member.id}`} className="text-sm">
                        ملاحظات
                      </Label>
                      <Textarea
                        id={`notes-${member.id}`}
                        value={record.notes}
                        onChange={(e) => updateNotes(member.id, e.target.value)}
                        placeholder="أضف ملاحظات..."
                        className="mt-1 resize-none"
                        rows={2}
                      />
                      {(record.recorded_by || record.created_at) && (
                        <p className="text-xs text-gray-500 mt-2">
                          {record.created_at && (
                            <span>{new Date(record.created_at).toLocaleString()} — </span>
                          )}
                          {record.recorded_by && (
                            <span>
                              بواسطة {users.find((u) => u.id === record.recorded_by)?.name || record.recorded_by}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-2 sm:bottom-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
        <Button
          onClick={saveAttendance}
          disabled={saving || Object.keys(attendance).length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg h-12 sm:h-auto"
          size="lg"
        >
          <Save className="h-5 w-5 ml-2" />
          {saving ? "جاري الحفظ..." : "حفظ الحضور"}
        </Button>
      </div>
      </div>
    </div>
  )
}
