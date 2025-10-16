"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface AttendanceRecord {
  date: string
  status: string
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[]
}

export function AttendanceChart({ attendance }: AttendanceChartProps) {
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; present: number; absent: number }>()

    attendance.forEach((record) => {
      const existing = dateMap.get(record.date) || { date: record.date, present: 0, absent: 0 }
      if (record.status === "present") {
        existing.present++
      } else {
        existing.absent++
      }
      dateMap.set(record.date, existing)
    })

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10) // Last 10 meetings
  }, [attendance])

  if (chartData.length === 0) {
    return <p className="text-center text-gray-500 py-8">لا توجد بيانات لعرضها</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" fill="#22c55e" name="حاضر" />
        <Bar dataKey="absent" fill="#ef4444" name="غائب" />
      </BarChart>
    </ResponsiveContainer>
  )
}
