"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, FileSpreadsheet, Download } from "lucide-react";

interface AnalyticsHeaderProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onExport: (format: "pdf" | "excel" | "csv") => void;
}

export function AnalyticsHeader({
  loading,
  refreshing,
  onRefresh,
  onExport,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 pt-1">
          لوحة المعلومات والتقارير
        </h2>
        <p className="text-xs md:text-sm text-gray-500">
          نظرة شاملة على إحصائيات الحضور والغياب
        </p>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="h-9"
        >
          <RefreshCw
            className={`h-4 w-4 ml-2 ${refreshing ? "animate-spin" : ""}`}
          />
          تحديث البيانات
        </Button>
        
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:bg-white hover:shadow-sm"
            onClick={() => onExport("pdf")}
            title="تصدير PDF"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:bg-white hover:shadow-sm"
            onClick={() => onExport("excel")}
            title="تصدير Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:bg-white hover:shadow-sm"
            onClick={() => onExport("csv")}
            title="تصدير CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

