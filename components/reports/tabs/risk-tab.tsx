"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Phone } from "lucide-react";
import { AtRiskStudent } from "../types";

interface RiskTabProps {
  atRiskStudents: AtRiskStudent[];
}

export function RiskTab({ atRiskStudents }: RiskTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm text-right">
          <CardHeader className="pt-5 pb-6 border-b border-gray-50 mb-6 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-bold pt-1">قائمة المتابعة العاجلة</CardTitle>
                <CardDescription className="mt-1 text-xs md:text-sm">
                  طلاب تغيبوا لاجتماعين متتاليين أو أكثر
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {atRiskStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900">ممتاز!</h3>
                <p className="text-sm md:text-base text-gray-500 mt-2">
                  لا يوجد طلاب في دائرة الخطر حالياً
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                          {student.name}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                          آخر حضور: {student.lastAttendance || "لم يحضر أبداً"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <div className="text-right shrink-0">
                        <Badge variant="destructive" className="mb-1 text-[10px] md:text-xs">
                          {student.absentCount} غياب متتالي
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8 md:h-9 text-xs md:text-sm"
                      >
                        <Phone className="h-3 w-3 md:h-4 md:w-4" />
                        اتصال
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-100 shadow-sm text-right">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-bold text-blue-900 mb-2 pt-1 text-sm md:text-base">💡 نصيحة للمتابعة</h3>
              <p className="text-xs md:text-sm text-blue-700 leading-relaxed">
                التواصل المبكر مع الطلاب المتغيبين يزيد من احتمالية عودتهم بنسبة 40%. حاول الاتصال بهم في نفس يوم الغياب للاطمئنان عليهم.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

