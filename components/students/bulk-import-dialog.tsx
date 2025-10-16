"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Member {
  name: string
  phone: string | null
  notes: string | null
}

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (members: Member[]) => void
}

export function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  const handleImport = () => {
    setError("")

    try {
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        setError("الرجاء إدخال بيانات للاستيراد")
        return
      }

      const members: Member[] = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim())
        return {
          name: parts[0] || "",
          phone: parts[1] || null,
          notes: parts[2] || null,
        }
      })

      // Validate that all members have names
      const invalidMembers = members.filter((m) => !m.name)
      if (invalidMembers.length > 0) {
        setError("جميع الطلاب يجب أن يكون لديهم اسم")
        return
      }

      onImport(members)
      setText("")
    } catch (err) {
      setError("حدث خطأ في معالجة البيانات")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">استيراد طلاب</DialogTitle>
          <DialogDescription className="text-gray-600">
            أدخل بيانات الطلاب، كل طالب في سطر منفصل بالصيغة: الاسم، رقم الهاتف، ملاحظات
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-text">البيانات</Label>
            <Textarea
              id="import-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="مارك جرجس، 01234567890، طالب نشيط&#10;مينا عادل، 01234567891&#10;كيرلس مجدي، 01234567892، يحتاج متابعة"
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              <strong>مثال:</strong>
              <br />
              مارك جرجس، 01234567890، طالب نشيط
              <br />
              مينا عادل، 01234567891
              <br />
              كيرلس مجدي، 01234567892، يحتاج متابعة
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
              استيراد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
