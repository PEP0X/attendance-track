"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Search, Calendar, Save, Users as UsersIcon, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
}

interface VisitRecord {
  member_id: string
  status: "visited" | "not_visited"
  notes: string
  visited_by?: string | null
  created_at?: string | null
}

export function VisitationRecorder() {
  const [members, setMembers] = useState<Member[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [visits, setVisits] = useState<Record<string, VisitRecord>>({})
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
    loadAssignments()
    loadVisits()
  }, [selectedDate])

  // Load current user id
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
      const { data, error } = await supabase.from("users").select("id,name").order("name")
      if (error) throw error
      setUsers((data || []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
    } catch (err) {
      console.error("Error loading users:", err)
    }
  }

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase.from("member_assignments").select("member_id,servant_id")
      if (error) throw error
      const map: Record<string, string | null> = {}
      ;(data || []).forEach((row: { member_id: string; servant_id: string | null }) => {
        map[row.member_id] = row.servant_id
      })
      setAssignments(map)
    } catch (err) {
      console.error("Error loading assignments:", err)
    }
  }

  const loadVisits = async () => {
    try {
      const { data, error } = await supabase.from("visits").select("*").eq("date", selectedDate)
      if (error) throw error
      const visitMap: Record<string, VisitRecord> = {}
      data?.forEach((record: { member_id: string; status: "visited" | "not_visited"; notes?: string | null; visited_by?: string | null; created_at?: string | null }) => {
        visitMap[record.member_id] = {
          member_id: record.member_id,
          status: record.status,
          notes: record.notes || "",
          visited_by: record.visited_by ?? null,
          created_at: record.created_at ?? null,
        }
      })
      setVisits(visitMap)
    } catch (err) {
      console.error("Error loading visits:", err)
    }
  }

  const toggleVisit = async (memberId: string, status: "visited" | "not_visited") => {
    setVisits((prev) => ({
      ...prev,
      [memberId]: {
        member_id: memberId,
        status,
        notes: prev[memberId]?.notes || "",
        visited_by: currentUserId ?? prev[memberId]?.visited_by ?? null,
      },
    }))

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const actorId = user?.id ?? null
      const payload = {
        member_id: memberId,
        date: selectedDate,
        status,
        notes: visits[memberId]?.notes || null,
        visited_by: actorId,
      }
      const { error } = await supabase.from("visits").upsert(payload, { onConflict: "member_id,date" })
      if (error) throw error
      hasUnsavedChangesRef.current = false
    } catch (err) {
      setVisits((prev) => ({ ...prev }))
    }
  }

  const updateNotes = (memberId: string, notes: string) => {
    setVisits((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        member_id: memberId,
        status: prev[memberId]?.status || "not_visited",
        notes,
      },
    }))
    hasUnsavedChangesRef.current = true
  }

  const saveVisits = async () => {
    if (Object.keys(visits).length === 0) return
    const proceed = window.confirm("سيتم استبدال سجلات هذا التاريخ. هل تريد المتابعة؟")
    if (!proceed) return
    setSaving(true)
    setMessage(null)
    try {
      const records = Object.values(visits).map((record) => ({
        member_id: record.member_id,
        date: selectedDate,
        status: record.status,
        notes: record.notes || null,
      }))
      const { error } = await supabase.from("visits").upsert(records, { onConflict: "member_id,date" })
      if (error) throw error
      setMessage({ type: "success", text: "تم حفظ الافتقاد بنجاح" })
      hasUnsavedChangesRef.current = false
      toast({ description: "تم الحفظ" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ الافتقاد" })
    } finally {
      setSaving(false)
    }
  }

  const filteredMembers = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [members, searchQuery],
  )

  // Group filtered members by assigned servant
  const groupedByServant = useMemo(() => {
    const groups: Record<string, Member[]> = {}
    filteredMembers.forEach((m) => {
      const sid = assignments[m.id] || "__unassigned__"
      if (!groups[sid]) groups[sid] = []
      groups[sid].push(m)
    })
    // sort each group's members by name for consistent UI
    Object.values(groups).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)))
    return groups
  }, [filteredMembers, assignments])

  // Determine up to 4 servant IDs to render sections for (equal separation UX)
  const servantSectionIds = useMemo(() => {
    const assignedServantIds = Object.keys(groupedByServant).filter((k) => k !== "__unassigned__")
    // Prefer the first 4 servants by users list order, falling back to discovered ids
    const preferred = users.map((u) => u.id).filter((id) => assignedServantIds.includes(id)).slice(0, 4)
    if (preferred.length < 4) {
      const rest = assignedServantIds.filter((id) => !preferred.includes(id)).slice(0, 4 - preferred.length)
      return [...preferred, ...rest]
    }
    return preferred
  }, [groupedByServant, users])

  const bulkMark = (status: "visited" | "not_visited") => {
    if (filteredMembers.length === 0) return
    setVisits((prev) => {
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
    setVisits((prev) => {
      const next = { ...prev }
      filteredMembers.forEach((m) => {
        delete next[m.id]
      })
      return next
    })
    hasUnsavedChangesRef.current = true
  }

  const stats = {
    total: members.length,
    visited: Object.values(visits).filter((a) => a.status === "visited").length,
    notVisited: Object.values(visits).filter((a) => a.status === "not_visited").length,
  }

  // Equal distribution helper UI (admin-only usage, but UI available for all; RLS guards writes)
  const distributeEquallyToFour = async () => {
    // Fetch servant ids (prefer exactly 4 if exist)
    const { data: servants } = await supabase.from("users").select("id").eq("role", "servant")
    if (!servants || servants.length === 0) return
    const selected = servants.slice(0, 4)
    if (selected.length === 0) return
    const servantIds = selected.map((s: any) => s.id)

    // Sort members by name for deterministic assignment
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name))
    const rows = sortedMembers.map((m, idx) => ({ member_id: m.id, servant_id: servantIds[idx % servantIds.length] }))

    // Upsert assignments (requires admin per RLS)
    const { error } = await supabase.from("member_assignments").upsert(rows, { onConflict: "member_id" })
    if (!error) {
      toast({ description: "تم توزيع الطلاب على 4 خدام بالتساوي" })
      await loadAssignments()
    } else {
      toast({ description: "فشل توزيع الطلاب. تأكد من امتلاك صلاحيات الادمن" })
    }
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
      {/* Sticky header */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-lg border-b-2 border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
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
            <Button onClick={distributeEquallyToFour} variant="outline" size="sm" className="border-2">
              <UsersIcon className="h-4 w-4 ml-1" />
              توزيع على 4 خدام
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-3 text-center border-2 border-slate-200 shadow-sm">
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">الكل</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-3 text-center border-2 border-emerald-300 shadow-sm">
              <p className="text-2xl font-black text-emerald-700">{stats.visited}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">تم الافتقاد</p>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-3 text-center border-2 border-rose-300 shadow-sm">
              <p className="text-2xl font-black text-rose-700">{stats.notVisited}</p>
              <p className="text-xs font-semibold text-rose-600 mt-1">لم يُفتقد</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="🔍 ابحث عن طالب..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-12 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button onClick={() => bulkMark("visited")} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <CheckCircle2 className="h-4 w-4 ml-1" />
              كله تم الافتقاد
            </Button>
            <Button onClick={() => bulkMark("not_visited")} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              <XCircle className="h-4 w-4 ml-1" />
              كله لم يُفتقد
            </Button>
            <Button onClick={bulkReset} size="sm" variant="outline" className="border-2 border-gray-300">
              إعادة تعيين
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
          <AlertDescription className="font-medium">{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6 pb-28">
        {filteredMembers.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-8 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">لا توجد نتائج</p>
              <p className="text-sm text-gray-400 mt-1">جرب البحث بكلمات أخرى</p>
            </CardContent>
          </Card>
        )}

        {/* Render 4 servant sections, separated, then unassigned if any */}
        {servantSectionIds.map((servantId, idx) => {
          const sectionMembers = groupedByServant[servantId] || []
          if (sectionMembers.length === 0) return null
          const servantName = users.find((u) => u.id === servantId)?.name || "خادم"
          return (
            <div key={servantId}>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-blue-800">{servantName}</h4>
                <span className="text-sm text-gray-600">{sectionMembers.length} طالب</span>
              </div>
              <Separator className="my-2" />
              <div className="space-y-3">
                {sectionMembers.map((member) => {
                  const record = visits[member.id]
                  const isVisited = record?.status === "visited"
                  const isNotVisited = record?.status === "not_visited"
                  const assignedServantName = users.find((u) => u.id === assignments[member.id])?.name
                  const tel = member.phones && member.phones.length > 0 ? member.phones[0].replace(/\s+/g, "") : null
                  return (
                    <Card
                      key={member.id}
                      className={cn(
                        "transition-all duration-300 hover:shadow-xl border-2",
                        isVisited && "border-emerald-400 bg-emerald-50/40 shadow-lg",
                        isNotVisited && "border-rose-400 bg-rose-50/40 shadow-lg",
                        !record && "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-900 break-words leading-tight">{member.name}</h3>
                              {assignedServantName && (
                                <p className="text-xs text-blue-700 mt-1">المسؤول: {assignedServantName}</p>
                              )}
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
                              {tel && (
                                <Button asChild size="sm" variant="outline" className="border-2">
                                  <a href={`tel:${tel}`} aria-label={`اتصال بـ ${member.name}`}>
                                    <Phone className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1">اتصال</span>
                                  </a>
                                </Button>
                              )}
                              <Button
                                onClick={() => toggleVisit(member.id, "visited")}
                                size="sm"
                                className={cn(
                                  "transition-all duration-200",
                                  isVisited
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg scale-110"
                                    : "bg-white border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50",
                                )}
                              >
                                <CheckCircle2 className={cn("h-4 w-4", isVisited && "animate-pulse")} />
                                <span className="hidden sm:inline ml-1">تم الافتقاد</span>
                              </Button>
                              <Button
                                onClick={() => toggleVisit(member.id, "not_visited")}
                                size="sm"
                                className={cn(
                                  "transition-all duration-200",
                                  isNotVisited
                                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg scale-110"
                                    : "bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50",
                                )}
                              >
                                <XCircle className={cn("h-4 w-4", isNotVisited && "animate-pulse")} />
                                <span className="hidden sm:inline ml-1">لم يُفتقد</span>
                              </Button>
                            </div>
                          </div>

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
                              {(record.visited_by || record.created_at) && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5">
                                  {record.created_at && (
                                    <span className="font-medium">{new Date(record.created_at).toLocaleString("ar-EG")}</span>
                                  )}
                                  {record.visited_by && (
                                    <>
                                      <span>•</span>
                                      <span>بواسطة {users.find((u) => u.id === record.visited_by)?.name || "مستخدم"}</span>
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
            </div>
          )
        })}

        {/* Unassigned group */}
        {groupedByServant["__unassigned__"] && groupedByServant["__unassigned__"].length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-800">بدون مسؤول</h4>
              <span className="text-sm text-gray-600">{groupedByServant["__unassigned__"].length} طالب</span>
            </div>
            <Separator className="my-2" />
            <div className="space-y-3">
              {groupedByServant["__unassigned__"].map((member) => {
                const record = visits[member.id]
                const isVisited = record?.status === "visited"
                const isNotVisited = record?.status === "not_visited"
                const tel = member.phones && member.phones.length > 0 ? member.phones[0].replace(/\s+/g, "") : null
                return (
                  <Card
                    key={member.id}
                    className={cn(
                      "transition-all duration-300 hover:shadow-xl border-2",
                      isVisited && "border-emerald-400 bg-emerald-50/40 shadow-lg",
                      isNotVisited && "border-rose-400 bg-rose-50/40 shadow-lg",
                      !record && "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
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
                            {tel && (
                              <Button asChild size="sm" variant="outline" className="border-2">
                                <a href={`tel:${tel}`} aria-label={`اتصال بـ ${member.name}`}>
                                  <Phone className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">اتصال</span>
                                </a>
                              </Button>
                            )}
                            <Button
                              onClick={() => toggleVisit(member.id, "visited")}
                              size="sm"
                              className={cn(
                                "transition-all duration-200",
                                isVisited
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg scale-110"
                                  : "bg-white border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50",
                              )}
                            >
                              <CheckCircle2 className={cn("h-4 w-4", isVisited && "animate-pulse")} />
                              <span className="hidden sm:inline ml-1">تم الافتقاد</span>
                            </Button>
                            <Button
                              onClick={() => toggleVisit(member.id, "not_visited")}
                              size="sm"
                              className={cn(
                                "transition-all duration-200",
                                isNotVisited
                                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg scale-110"
                                  : "bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50",
                              )}
                            >
                              <XCircle className={cn("h-4 w-4", isNotVisited && "animate-pulse")} />
                              <span className="hidden sm:inline ml-1">لم يُفتقد</span>
                            </Button>
                          </div>
                        </div>

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
                            {(record.visited_by || record.created_at) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5">
                                {record.created_at && (
                                  <span className="font-medium">{new Date(record.created_at).toLocaleString("ar-EG")}</span>
                                )}
                                {record.visited_by && (
                                  <>
                                    <span>•</span>
                                    <span>بواسطة {users.find((u) => u.id === record.visited_by)?.name || "مستخدم"}</span>
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
          </div>
        )}
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={saveVisits}
            disabled={saving || Object.keys(visits).length === 0}
            className="w-full h-16 text-lg font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 rounded-2xl border-2 border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <Save className="h-6 w-6 ml-2" />
            {saving ? "جاري الحفظ..." : "💾 حفظ الافتقاد"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VisitationRecorder


