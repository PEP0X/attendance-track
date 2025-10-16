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
    <div className="relative">
      {/* Modern Sticky Top Section - Date, Stats, Search & Actions */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-lg border-b-2 border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 flex-1">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-3 text-center border-2 border-slate-200 shadow-sm">
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">الكل</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-3 text-center border-2 border-emerald-300 shadow-sm">
              <p className="text-2xl font-black text-emerald-700">{stats.present}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">حاضر</p>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-3 text-center border-2 border-rose-300 shadow-sm">
              <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
              <p className="text-xs font-semibold text-rose-600 mt-1">غائب</p>
            </div>
          </div>

          {/* Modern Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="🔍 ابحث عن طالب..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-12 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Modern Bulk Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button 
              onClick={() => bulkMark("present")}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="h-4 w-4 ml-1" />
              كله حاضر
            </Button>
            <Button 
              onClick={() => bulkMark("absent")}
              size="sm"
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <XCircle className="h-4 w-4 ml-1" />
              كله غائب
            </Button>
            <Button 
              onClick={bulkReset}
              size="sm"
              variant="outline"
              className="border-2 border-gray-300 hover:bg-gray-100 font-semibold"
            >
              إعادة تعيين
            </Button>
            <Button 
              onClick={markUnselectedAsAbsent}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              الباقي غائبين
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

      {/* Modern Student Cards */}
      <div className="space-y-3 pb-28">
        {filteredMembers.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-8 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">لا توجد نتائج</p>
              <p className="text-sm text-gray-400 mt-1">جرب البحث بكلمات أخرى</p>
            </CardContent>
          </Card>
        )}
        
        {filteredMembers.map((member) => {
          const record = attendance[member.id]
          const isPresent = record?.status === "present"
          const isAbsent = record?.status === "absent"

          return (
            <Card 
              key={member.id} 
              className={cn(
                "transition-all duration-300 hover:shadow-xl border-2",
                isPresent && "border-emerald-400 bg-emerald-50/40 shadow-lg",
                isAbsent && "border-rose-400 bg-rose-50/40 shadow-lg",
                !record && "border-gray-200 hover:border-gray-300"
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Name & Status Buttons */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 break-words leading-tight">{member.name}</h3>
                      {member.phones && member.phones.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1.5 break-all">{member.phones.join(" • ")}</p>
                      )}
                      {member.notes && (
                        <div className="mt-2 inline-flex">
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
                            {member.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => toggleAttendance(member.id, "present")}
                        size="sm"
                        className={cn(
                          "transition-all duration-200",
                          isPresent 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg scale-110" 
                            : "bg-white border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        )}
                      >
                        <CheckCircle2 className={cn("h-4 w-4", isPresent && "animate-pulse")} />
                        <span className="hidden sm:inline ml-1">حاضر</span>
                      </Button>
                      <Button
                        onClick={() => toggleAttendance(member.id, "absent")}
                        size="sm"
                        className={cn(
                          "transition-all duration-200",
                          isAbsent 
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg scale-110" 
                            : "bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                        )}
                      >
                        <XCircle className={cn("h-4 w-4", isAbsent && "animate-pulse")} />
                        <span className="hidden sm:inline ml-1">غائب</span>
                      </Button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {record && (
                    <div className="pt-3 border-t-2 border-gray-200">
                      <Label htmlFor={`notes-${member.id}`} className="text-xs font-bold text-gray-600 uppercase">
                        ملاحظات
                      </Label>
                      <Textarea
                        id={`notes-${member.id}`}
                        value={record.notes}
                        onChange={(e) => updateNotes(member.id, e.target.value)}
                        placeholder="أضف ملاحظات هنا..."
                        className="mt-2 resize-none text-sm border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                        rows={2}
                      />
                      {(record.recorded_by || record.created_at) && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5">
                          {record.created_at && (
                            <span className="font-medium">{new Date(record.created_at).toLocaleString("ar-EG")}</span>
                          )}
                          {record.recorded_by && (
                            <>
                              <span>•</span>
                              <span>بواسطة {users.find((u) => u.id === record.recorded_by)?.name || "مستخدم"}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modern Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={saveAttendance}
            disabled={saving || Object.keys(attendance).length === 0}
            className="w-full h-16 text-lg font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 rounded-2xl border-2 border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <Save className="h-6 w-6 ml-2" />
            {saving ? "جاري الحفظ..." : "💾 حفظ الحضور"}
          </Button>
        </div>
      </div>
    </div>
  )
}
