"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table"
import {
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Save,
  User,
  Phone,
  FileText,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
  deacon_rank?: string | null
}

interface AttendanceRecord {
  member_id: string
  status: "present" | "absent"
  notes: string
  recorded_by?: string | null
  created_at?: string | null
}

interface AttendanceRecorderProps {
  initialMembers: Member[]
  usersList: { id: string; name: string }[]
}

interface AttendanceRow {
  member: Member
  record: AttendanceRecord | undefined
}

export function AttendanceRecorder({
  initialMembers,
  usersList,
}: AttendanceRecorderProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({})
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const hasUnsavedChangesRef = useRef(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // If initial props are empty, try fetching client-side as fallback
  useEffect(() => {
    if (initialMembers.length > 0) {
      setMembers(initialMembers)
    } else {
      // Fallback fetch
      void loadMembers()
    }
  }, [initialMembers])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name", { ascending: true })
      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error("Error loading members client-side fallback:", err)
    }
  }

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  // Load current user id for suppressing self toasts
  useEffect(() => {
    let mounted = true;
    (async () => {
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
    const channel = supabase
      .channel(`realtime-attendance-${selectedDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `date=eq.${selectedDate}`,
        },
        (payload: any) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          if (eventType === "INSERT" || eventType === "UPDATE") {
            const rec = payload.new as {
              member_id: string
              status: "present" | "absent"
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
                notes: rec.notes || "",
                recorded_by: rec.recorded_by ?? null,
                created_at: rec.created_at ?? null,
              },
            }))

            const isSelfChange =
              rec.recorded_by &&
              currentUserId &&
              rec.recorded_by === currentUserId
            if (!isSelfChange) {
              const memberName =
                members.find((m) => m.id === rec.member_id)?.name || "طالب"
              const who =
                usersList.find((u) => u.id === rec.recorded_by)?.name ||
                "مستخدم"
              toast({
                description: `${memberName}: ${
                  rec.status === "present" ? "حاضر" : "غائب"
                } — بواسطة ${who}`,
              })
            }
          } else if (eventType === "DELETE") {
            const oldRec = payload.old as { member_id: string; date: string }
            setAttendance((prev) => {
              const next = { ...prev }
              delete next[oldRec.member_id]
              return next
            })
            const memberName =
              members.find((m) => m.id === oldRec.member_id)?.name || "طالب"
            toast({ description: `تم إزالة سجل الحضور لـ ${memberName}` })
          }
        }
      )
      // Also listen for member changes to keep the list fresh without reload
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        (payload: any) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE"
          if (eventType === "INSERT") {
            const m = payload.new as Member
            setMembers((prev) =>
              [...prev, m].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
              )
            )
            toast({ description: `تم إضافة طالب جديد: ${m.name}` })
          } else if (eventType === "UPDATE") {
            const m = payload.new as Member
            setMembers((prev) =>
              prev
                .map((x) => (x.id === m.id ? m : x))
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, {
                    sensitivity: "base",
                  })
                )
            )
          } else if (eventType === "DELETE") {
            const m = payload.old as { id: string }
            setMembers((prev) => prev.filter((x) => x.id !== m.id))
            setAttendance((prev) => {
              const next = { ...prev }
              delete next[m.id]
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate, supabase, currentUserId, members, toast, usersList])

  const {
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
  } = useQuery({
    queryKey: ["attendance", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", selectedDate)

      if (error) {
        throw error
      }

      const attendanceMap: Record<string, AttendanceRecord> = {}
      data?.forEach((record: any) => {
        attendanceMap[record.member_id] = {
          member_id: record.member_id,
          status: record.status,
          notes: record.notes || "",
          recorded_by: record.recorded_by ?? null,
          created_at: record.created_at ?? null,
        }
      })
      setAttendance(attendanceMap)
      return attendanceMap
    },
    onError: () => {
      toast({ variant: "destructive", description: "فشل تحميل بيانات الحضور" })
    },
  })

  const toggleAttendance = async (
    memberId: string,
    status: "present" | "absent"
  ) => {
    const currentRecord = attendance[memberId]
    // If same status is clicked, toggle it off (remove record)
    const isRemoving = currentRecord?.status === status

    if (isRemoving) {
      setAttendance((prev) => {
        const next = { ...prev }
        delete next[memberId]
        return next
      })
      hasUnsavedChangesRef.current = true

      try {
        // Remove from DB immediately
        const { error } = await supabase
          .from("attendance")
          .delete()
          .match({ member_id: memberId, date: selectedDate })

        if (error) throw error
      } catch (err) {
        // Revert optimistic update on error
        setAttendance((prev) => ({ ...prev, [memberId]: currentRecord }))
        toast({ variant: "destructive", description: "فشل إلغاء الحالة" })
      }
    } else {
      // Set new status
      setAttendance((prev) => ({
        ...prev,
        [memberId]: {
          member_id: memberId,
          status,
          notes: prev[memberId]?.notes || "",
          recorded_by: currentUserId ?? prev[memberId]?.recorded_by ?? null,
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
          notes: attendance[memberId]?.notes || null,
          recorded_by: actorId,
        }

        const { error } = await supabase
          .from("attendance")
          .upsert(payload, { onConflict: "member_id,date" })
        if (error) throw error
        hasUnsavedChangesRef.current = false
      } catch (err) {
        setAttendance((prev) => ({ ...prev })) // Force re-render / revert if needed logic
        toast({ variant: "destructive", description: "فشل حفظ الحالة" })
      }
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
    const proceed = window.confirm(
      "سيتم استبدال سجلات هذا التاريخ. هل تريد المتابعة؟"
    )
    if (!proceed) return
    setSaving(true)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

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
      toast({ description: "تم الحفظ بنجاح" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ الحضور" })
    } finally {
      setSaving(false)
    }
  }

  const filteredMembers = useMemo(
    () =>
      members.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [members, searchQuery]
  )

  const bulkMark = (status: "present" | "absent") => {
    if (filteredMembers.length === 0) return
    setAttendance((prev) => {
      const next = { ...prev }
      filteredMembers.forEach((m) => {
        next[m.id] = {
          member_id: m.id,
          status,
          notes: next[m.id]?.notes || "",
        }
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
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
    present: Object.values(attendance).filter((a) => a.status === "present")
      .length,
    absent: Object.values(attendance).filter((a) => a.status === "absent")
      .length,
  }

  const tableData: AttendanceRow[] = useMemo(
    () =>
      filteredMembers.map((member) => ({
        member,
        record: attendance[member.id],
      })),
    [filteredMembers, attendance],
  )

  const columns = useMemo<ColumnDef<AttendanceRow>[]>(
    () => [
      {
        id: "member",
        header: () => <span>الطالب</span>,
        cell: ({ row }) => {
          const member = row.original.member
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">{member.name}</span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {member.phones && member.phones.length > 0 && (
                  <div className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{member.phones[0]}</span>
                    {member.phones.length > 1 && (
                      <span className="bg-gray-100 px-1 rounded text-[10px]">
                        +{member.phones.length - 1}
                      </span>
                    )}
                  </div>
                )}
                {member.notes && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 text-amber-700">
                    <FileText className="w-3 h-3" />
                    <span className="line-clamp-1">{member.notes}</span>
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: "status",
        header: () => <span>الحالة</span>,
        cell: ({ row }) => {
          const record = row.original.record
          const isPresent = record?.status === "present"
          const isAbsent = record?.status === "absent"
          const memberId = row.original.member.id
          return (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => toggleAttendance(memberId, "present")}
                variant="ghost"
                className={cn(
                  "flex-1 rounded-xl border-2 h-10 font-bold text-sm px-3",
                  isPresent
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-md"
                    : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200",
                )}
              >
                <CheckCircle2 className="w-4 h-4 ml-1.5" />
                حاضر
              </Button>
              <Button
                onClick={() => toggleAttendance(memberId, "absent")}
                variant="ghost"
                className={cn(
                  "flex-1 rounded-xl border-2 h-10 font-bold text-sm px-3",
                  isAbsent
                    ? "bg-rose-500 border-rose-500 text-white shadow-rose-200 shadow-md"
                    : "bg-white border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200",
                )}
              >
                <XCircle className="w-4 h-4 ml-1.5" />
                غائب
              </Button>
            </div>
          )
        },
        size: 260,
      },
      {
        id: "notes",
        header: () => <span>ملاحظات الحضور</span>,
        cell: ({ row }) => {
          const memberId = row.original.member.id
          const record = row.original.record
          const recordedByName =
            record?.recorded_by &&
            usersList.find((u) => u.id === record.recorded_by)?.name

          return (
            <div className="flex flex-col gap-1">
              <Textarea
                value={record?.notes ?? ""}
                onChange={(e) => updateNotes(memberId, e.target.value)}
                placeholder="ملاحظات إضافية..."
                className="min-h-[52px] bg-white/70 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 rounded-xl resize-none text-sm"
              />
              {recordedByName && (
                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 font-medium">
                  <span>بواسطة {recordedByName}</span>
                </div>
              )}
            </div>
          )
        },
      },
    ],
    [toggleAttendance, updateNotes, usersList],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isLoadingTable = attendanceLoading || attendanceFetching

  return (
    <div className="relative pb-32">
      {/* Modern Sticky Top Section */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-8">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-b-3xl p-4 sm:p-6 space-y-5 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Date Picker */}
            <div className="relative group w-full sm:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-base font-semibold text-gray-800 focus-visible:ring-0 w-full sm:w-auto cursor-pointer"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <div className="flex-1 min-w-[100px] bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  الكل
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {stats.total}
                </span>
              </div>
              <div className="flex-1 min-w-[100px] bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  حاضر
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {stats.present}
                </span>
              </div>
              <div className="flex-1 min-w-[100px] bg-rose-50/60 rounded-2xl p-3 border border-rose-100 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  غائب
                </span>
                <span className="text-2xl font-black text-rose-700">
                  {stats.absent}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="بحث بالاسم..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-12 h-12 bg-white/90 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 rounded-2xl shadow-sm text-base transition-shadow"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <Button
                onClick={() => bulkMark("present")}
                variant="outline"
                className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 whitespace-nowrap font-bold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" /> كله حاضر
              </Button>
              <Button
                onClick={() => bulkMark("absent")}
                variant="outline"
                className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 whitespace-nowrap font-bold shadow-sm"
              >
                <XCircle className="w-4 h-4 ml-2" /> كله غائب
              </Button>
              <Button
                onClick={markUnselectedAsAbsent}
                variant="outline"
                className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 whitespace-nowrap font-bold shadow-sm"
              >
                <User className="w-4 h-4 ml-2" /> الباقي غائب
              </Button>
              <Button
                onClick={bulkReset}
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 px-1"
        >
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="rounded-2xl border-0 shadow-lg bg-white ring-1 ring-black/5"
          >
            <AlertDescription className="font-bold text-lg text-center">
              {message.text}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Modern Table Dashboard */}
      <div className="mt-4 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl overflow-hidden">
        {tableData.length === 0 && !isLoadingTable ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-xl font-semibold text-gray-600">لا توجد نتائج</p>
            <p className="text-gray-400 mt-2">حاول البحث باسم آخر</p>
          </div>
        ) : (
          <>
            <div className="relative">
              {isLoadingTable && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
              )}
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gradient-to-l from-indigo-50 to-blue-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "text-right text-xs sm:text-sm font-semibold text-gray-700 py-3 px-3 sm:px-4 whitespace-nowrap",
                            )}
                            style={{
                              width: header.getSize()
                                ? `${header.getSize()}px`
                                : undefined,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="align-top py-3 px-3 sm:px-4 text-xs sm:text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {Object.keys(attendance).length > 0 && !saving && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
          >
            <Button
              onClick={saveAttendance}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-indigo-500/50 border border-white/20 backdrop-blur-md text-lg font-bold transition-all duration-300 transform hover:scale-105 pointer-events-auto"
            >
              <Save className="w-5 h-5 ml-2" />
              حفظ التغييرات ({Object.keys(attendance).length})
            </Button>
          </motion.div>
        )}
        {saving && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-black/80 text-white backdrop-blur-xl rounded-full shadow-2xl flex items-center gap-3"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span className="font-medium">جاري الحفظ...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
