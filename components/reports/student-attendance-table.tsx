"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

interface AttendanceRecord {
  id: string
  date: string
  status: string
  notes: string | null
  member: {
    name: string
  }
}

interface StudentAttendanceTableProps {
  attendance: AttendanceRecord[]
}

export function StudentAttendanceTable({ attendance }: StudentAttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedDates, setExpandedDates] = useState<string[]>([])

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <Calendar className="h-12 w-12 mb-4 text-gray-300" />
        <p>لا توجد سجلات للعرض</p>
      </div>
    )
  }

  // Filter records based on search query
  const filteredAttendance = attendance.filter(record => 
    record.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Group attendance by date
  const byDate = filteredAttendance.reduce<Record<string, AttendanceRecord[]>>((acc, rec) => {
    const key = rec.date
    if (!acc[key]) acc[key] = []
    acc[key].push(rec)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  const toggleDate = (date: string) => {
    setExpandedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const toggleAll = () => {
    if (expandedDates.length === sortedDates.length) {
      setExpandedDates([])
    } else {
      setExpandedDates(sortedDates)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="بحث باسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{filteredAttendance.length} سجل</span>
          <Button variant="ghost" size="sm" onClick={toggleAll} className="h-8 px-2">
            {expandedDates.length === sortedDates.length ? "طي الكل" : "توسيع الكل"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedDates.map((date) => {
          const records = byDate[date]
          const presentCount = records.filter((r) => r.status === "present").length
          const absentCount = records.length - presentCount
          const isExpanded = expandedDates.includes(date)

          return (
            <Collapsible
              key={date}
              open={isExpanded}
              onOpenChange={() => toggleDate(date)}
              className="bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200"
            >
              <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{date}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {records.length} طالب
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {presentCount}
                    </div>
                    <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {absentCount}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="text-right py-2 w-[40%]">الطالب</TableHead>
                        <TableHead className="text-right py-2 w-[20%]">الحالة</TableHead>
                        <TableHead className="text-right py-2 w-[40%]">الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium py-2">{record.member.name}</TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant={record.status === "present" ? "default" : "destructive"}
                              className={`shadow-none font-normal ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                                  : "bg-red-100 text-red-700 hover:bg-red-200 border-0"
                              }`}
                            >
                              {record.status === "present" ? "حاضر" : "غائب"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 py-2 text-sm">{record.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
