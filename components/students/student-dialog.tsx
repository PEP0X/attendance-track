"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Member {
  id: string
  name: string
  phone: string | null
  notes: string | null
}

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSave: (data: Omit<Member, "id">) => void
}

export function StudentDialog({ open, onOpenChange, member, onSave }: StudentDialogProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (member) {
      setName(member.name)
      setPhone(member.phone || "")
      setNotes(member.notes || "")
    } else {
      setName("")
      setPhone("")
      setNotes("")
    }
  }, [member, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      phone: phone || null,
      notes: notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{member ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {member ? "قم بتعديل بيانات الطالب" : "أدخل بيانات الطالب الجديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطالب" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01234567890"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {member ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
