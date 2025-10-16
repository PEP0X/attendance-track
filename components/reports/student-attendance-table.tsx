"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
  if (attendance.length === 0) {
    return <p className="text-center text-gray-500 py-8">لا توجد سجلات</p>
  }

  // Group attendance by date (parent already sorts by date desc)
  const byDate = attendance.reduce<Record<string, AttendanceRecord[]>>((acc, rec) => {
    const key = rec.date
    if (!acc[key]) acc[key] = []
    acc[key].push(rec)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="w-full">
        {sortedDates.map((date) => {
          const records = byDate[date]
          const presentCount = records.filter((r) => r.status === "present").length
          const absentCount = records.length - presentCount
          return (
            <AccordionItem key={date} value={date}>
              <AccordionTrigger className="px-2">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{date}</span>
                    <span className="text-xs text-gray-500">عدد السجلات: {records.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-300">حاضر: {presentCount}</Badge>
                    <Badge className="bg-red-100 text-red-700 border-red-300">غائب: {absentCount}</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الطالب</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.member.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={record.status === "present" ? "default" : "destructive"}
                              className={
                                record.status === "present"
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-red-100 text-red-700 border-red-300"
                              }
                            >
                              {record.status === "present" ? "حاضر" : "غائب"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{record.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
