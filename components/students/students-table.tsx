"use client"

import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  useReactTable,
  SortingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Phone, FileText, User, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type DeaconRank =
  | "not_deacon" // مش شماس
  | "absalts" // أبصلتس
  | "agnostis" // أغنسطس

export interface StudentMember {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
  deacon_rank: DeaconRank | null
}

export interface StudentRow {
  member: StudentMember
  attendanceCount: number
}

interface StudentsTableProps {
  rows: StudentRow[]
  onEdit: (member: StudentMember) => void
  onDelete: (id: string) => void
  onRankChange: (id: string, rank: DeaconRank | null) => void
}

function formatRankLabel(rank: DeaconRank | null) {
  if (rank === null) return "غير محدد"
  if (rank === "not_deacon") return "مش شماس"
  switch (rank) {
    case "absalts":
      return "أبصلتس"
    case "agnostis":
      return "أغنسطس"
    default:
      return rank
  }
}

function rankBadgeClass(rank: DeaconRank | null) {
  if (rank === null) {
    return "bg-gray-50 text-gray-500 border-gray-200"
  }
  if (rank === "not_deacon") {
    return "bg-gray-100 text-gray-700 border-gray-200"
  }
  if (rank === "absalts") {
    return "bg-blue-50 text-blue-700 border-blue-200"
  }
  if (rank === "agnostis") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
  return "bg-gray-100 text-gray-700 border-gray-200"
}

export function StudentsTable({ rows, onEdit, onDelete, onRankChange }: StudentsTableProps) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])

  // Debounce search input
  useMemo(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(({ member }) => {
      const nameMatch = member.name.toLowerCase().includes(q)
      const phonesMatch = (member.phones || []).some((p) => p.toLowerCase().includes(q))
      const notesMatch = (member.notes || "").toLowerCase().includes(q)
      return nameMatch || phonesMatch || notesMatch
    })
  }, [rows, search])

  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.member.name,
        header: () => <span>الطالب</span>,
        cell: ({ row }) => {
          const member = row.original.member
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                {member.name}
              </span>
            </div>
          )
        },
      },
      {
        id: "phones",
        header: () => <span className="whitespace-nowrap">أرقام التليفون</span>,
        cell: ({ row }) => {
          const member = row.original.member
          if (!member.phones || member.phones.length === 0) {
            return <span className="text-[11px] text-gray-400">لا يوجد رقم</span>
          }
          return (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              {member.phones.map((p, idx) => (
                <span
                  key={`${p}-${idx}`}
                  className="inline-flex items-center gap-1 bg-emerald-50/80 border border-emerald-100 px-2 py-0.5 rounded-full"
                >
                  <Phone className="w-3 h-3" />
                  <span>{p}</span>
                </span>
              ))}
            </div>
          )
        },
        size: 210,
      },
      {
        id: "attendance",
        accessorFn: (row) => row.attendanceCount,
        header: () => <span>مرات الحضور</span>,
        cell: ({ row }) => {
          const count = row.original.attendanceCount
          const level =
            count >= 15 ? "high" : count >= 8 ? "medium" : count > 0 ? "low" : "none"
          const classes =
            level === "high"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : level === "medium"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : level === "low"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
          return (
            <div className="flex items-center justify-start">
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-full border",
                  classes,
                )}
              >
                {count}
              </span>
            </div>
          )
        },
        size: 110,
      },
      {
        id: "rank",
        accessorFn: (row) => row.member.deacon_rank ?? "not_deacon",
        header: () => <span className="whitespace-nowrap">الرتبة الشماسية</span>,
        cell: ({ row }) => {
          const member = row.original.member
          const rank = member.deacon_rank
          return (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  // Cycle: null -> absalts -> agnostis -> null
                  // (If DB already contains "not_deacon", treat it like null for cycling)
                  let next: DeaconRank | null
                  if (rank === null || rank === "not_deacon") next = "absalts"
                  else if (rank === "absalts") next = "agnostis"
                  else next = null // rank === "agnostis"

                  onRankChange(member.id, next)
                }}
                className="focus:outline-none"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 rounded-full border transition-colors",
                    rankBadgeClass(rank),
                  )}
                >
                  {formatRankLabel(rank)}
                </Badge>
              </button>
            </div>
          )
        },
        size: 150,
      },
      {
        id: "actions",
        header: () => <span className="whitespace-nowrap">إجراءات سريعة</span>,
        cell: ({ row }) => {
          const member = row.original.member
          return (
            <div className="flex items-center justify-start gap-2 sm:flex-col sm:items-start">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(member)}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(member.id)}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )
        },
        size: 140,
      },
    ],
    [onDelete, onEdit, onRankChange],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="mt-4 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-3xl overflow-hidden">
      <div className="px-4 pt-3 pb-3 border-b bg-gradient-to-l from-indigo-50 to-blue-50 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">جدول الطلاب</p>
          <p className="text-xs text-gray-500">
            عرض شامل لكل الطلاب مع الحضور والرتبة الشماسية
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="بحث بالاسم، الموبايل أو الملاحظات..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9 h-10 text-sm bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/80">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-right text-xs sm:text-sm font-semibold text-gray-700 py-3 px-3 sm:px-4 whitespace-nowrap select-none",
                      header.column.getCanSort() ? "cursor-pointer" : "",
                      header.column.id === "name"
                        ? "sticky right-0 z-20 bg-slate-50/95 backdrop-blur-sm"
                        : "",
                    )}
                    style={{
                      width: header.getSize() ? `${header.getSize()}px` : undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-400 text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-6 w-6 text-gray-300" />
                    <p className="font-medium text-gray-500">
                      لا توجد نتائج مطابقة للبحث الحالي
                    </p>
                    <p className="text-xs text-gray-400">
                      جرّب تعديل كلمة البحث أو مسحها لعرض كل الطلاب
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "align-top py-2.5 px-2.5 sm:py-3 sm:px-4 text-xs sm:text-sm",
                        cell.column.id === "name"
                          ? "sticky right-0 z-10 bg-white"
                          : "",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

