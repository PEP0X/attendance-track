"use client"

import { useMemo } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface AttendanceRecord {
  date: string
  status: string
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[]
}

const COLORS = ['#22c55e', '#ef4444'];

export function AttendanceChart({ attendance }: AttendanceChartProps) {
  const { barData, pieData } = useMemo(() => {
    const dateMap = new Map<string, { date: string; present: number; absent: number }>()
    let totalPresent = 0
    let totalAbsent = 0

    attendance.forEach((record) => {
      const existing = dateMap.get(record.date) || { date: record.date, present: 0, absent: 0 }
      if (record.status === "present") {
        existing.present++
        totalPresent++
      } else {
        existing.absent++
        totalAbsent++
      }
      dateMap.set(record.date, existing)
    })

    const barData = Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10) // Last 10 meetings

    const pieData = [
      { name: 'حاضر', value: totalPresent },
      { name: 'غائب', value: totalAbsent },
    ]

    return { barData, pieData }
  }, [attendance])

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p>لا توجد بيانات لعرضها</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-[350px]">
        <h4 className="text-sm font-medium text-gray-500 mb-4 text-center">تحليل الحضور اليومي (آخر 10 اجتماعات)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#888' }} 
              axisLine={false} 
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#888' }} 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              dataKey="present" 
              name="حاضر" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]} 
              barSize={30}
            />
            <Bar 
              dataKey="absent" 
              name="غائب" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[350px] flex flex-col items-center justify-center bg-gray-50/50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">ملخص الحضور العام</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-[-10px]">
          <span className="text-2xl font-bold text-gray-700">
            {Math.round((pieData[0].value / (pieData[0].value + pieData[1].value || 1)) * 100)}%
          </span>
          <p className="text-xs text-gray-500">نسبة الحضور</p>
        </div>
      </div>
    </div>
  )
}
