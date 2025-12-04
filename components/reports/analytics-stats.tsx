"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";
import { Stats } from "./types";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: string;
  subtext: string;
}

function StatCard({ title, value, icon: Icon, color, subtext }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-white text-right">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4 flex-row-reverse">
          <div className={`p-3 md:p-4 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
            <Icon className={`h-6 w-6 md:h-8 md:w-8 ${color.replace("bg-", "text-")}`} />
          </div>
          <div className="text-right space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground pt-1 truncate">
              {title}
            </p>
            <h3 className="text-2xl md:text-3xl font-bold truncate">{value}</h3>
          </div>
        </div>
        {subtext && (
          <div className="mt-4 md:mt-6 text-xs font-medium text-muted-foreground border-t pt-3 md:pt-4 text-right truncate">
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsStatsProps {
  stats: Stats;
  atRiskCount: number;
  loading: boolean;
}

export function AnalyticsStats({ stats, atRiskCount, loading }: AnalyticsStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="نسبة الحضور"
        value={
          loading ? <Skeleton className="h-8 w-12" /> : `${stats.averageAttendance}%`
        }
        icon={TrendingUp}
        color="bg-amber-500"
        subtext="متوسط الحضور العام للفترة"
      />
      <StatCard
        title="الطلاب المسجلين"
        value={loading ? <Skeleton className="h-8 w-12" /> : stats.totalStudents}
        icon={Users}
        color="bg-purple-500"
        subtext="إجمالي قاعدة البيانات"
      />
      <StatCard
        title="اجتماعات تم رصدها"
        value={loading ? <Skeleton className="h-8 w-12" /> : stats.totalMeetings}
        icon={Calendar}
        color="bg-blue-500"
        subtext="عدد مرات رصد الحضور"
      />
      <StatCard
        title="حالات غياب متكرر"
        value={loading ? <Skeleton className="h-8 w-12" /> : atRiskCount}
        icon={AlertTriangle}
        color="bg-red-500"
        subtext="غابوا مرتين أو أكثر متتاليتين"
      />
    </div>
  );
}

