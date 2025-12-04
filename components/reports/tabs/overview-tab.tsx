"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { AttendanceRecord, Stats } from "../types";

const AttendanceChart = dynamic(
  () => import("../attendance-chart").then((m) => m.AttendanceChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
  }
);

interface OverviewTabProps {
  attendance: AttendanceRecord[];
  stats: Stats;
  loading: boolean;
}

export function OverviewTab({ attendance, stats, loading }: OverviewTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm text-right">
          <CardHeader className="pt-5 px-4 md:px-6">
            <CardTitle className="text-lg md:text-xl font-bold">اتجاهات الحضور</CardTitle>
            <CardDescription>تحليل بياني لنسب الحضور عبر الزمن</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pr-2 md:pr-6">
            <AttendanceChart attendance={attendance} />
          </CardContent>
        </Card>

        {/* Summary Distribution */}
        <Card className="lg:col-span-3 border-none shadow-sm text-right">
          <CardHeader className="pt-5 px-4 md:px-6">
            <CardTitle className="text-lg md:text-xl font-bold">توزيع الحالات</CardTitle>
            <CardDescription>ملخص الحضور والغياب الإجمالي</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-4 md:p-6">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-sm md:text-base">حضور</p>
                    <p className="text-xs text-green-600">إجمالي المسجلين</p>
                  </div>
                </div>
                <span className="text-xl md:text-2xl font-bold text-green-700">
                  {loading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.totalPresent}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-red-900 text-sm md:text-base">غياب</p>
                    <p className="text-xs text-red-600">إجمالي المسجلين</p>
                  </div>
                </div>
                <span className="text-xl md:text-2xl font-bold text-red-700">
                  {loading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.totalAbsent}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

