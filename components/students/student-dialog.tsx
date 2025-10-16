"use client"

import type React from "react"

import { useState, useEffect } from "react"
// Native Tailwind-only modal. No external UI components.

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
}

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSave: (data: { name: string; phones: string[] | null; notes: string | null }) => void
}

export function StudentDialog({ open, onOpenChange, member, onSave }: StudentDialogProps) {
  const [name, setName] = useState("")
  const [phones, setPhones] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [phoneDraft, setPhoneDraft] = useState("")

  useEffect(() => {
    if (member) {
      setName(member.name)
      setPhones(member.phones || [])
      setNotes(member.notes || "")
    } else {
      setName("")
      setPhones([])
      setNotes("")
    }
  }, [member, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = phones
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
    onSave({ name, phones: normalized.length ? normalized : null, notes: notes || null })
  }

  const addPhoneFromDraft = () => {
    const trimmed = phoneDraft.trim()
    if (!trimmed) return
    if (phones.includes(trimmed)) {
      setPhoneDraft("")
      return
    }
    setPhones([...phones, trimmed])
    setPhoneDraft("")
  }

  const handlePhoneDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault()
      addPhoneFromDraft()
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" onClick={onOverlayClick}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-lg bg-white shadow-lg ring-1 ring-black/5" dir="rtl">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">{member ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</h2>
            <p className="mt-1 text-sm text-gray-600">{member ? "قم بتحديث بيانات الطالب" : "أدخل بيانات الطالب الجديد"}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-6">
            <div className="grid gap-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">الاسم *</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطالب" required className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">أرقام الهاتف</label>

                {phones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {phones.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-full border bg-gray-50 text-gray-700 px-3 py-1 text-sm">
                        {p}
                        <button
                          type="button"
                          onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                          className="mr-2 inline-flex items-center justify-center rounded hover:text-red-600"
                          aria-label="حذف الرقم"
                          title="حذف الرقم"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 flex-row-reverse">
                  <input
                    className="h-10 flex-1 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    onKeyDown={handlePhoneDraftKeyDown}
                    placeholder="01234567890"
                    type="tel"
                  />
                  <button type="button" onClick={addPhoneFromDraft} className="h-10 px-4 min-w-[88px] rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    إضافة
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-end">اضغط Enter لإضافة الرقم. يمكنك إضافة أكثر من رقم.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                  className="min-h-[96px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                إلغاء
              </button>
              <button type="submit" className="h-10 px-5 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {member ? "حفظ التعديلات" : "إضافة"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
