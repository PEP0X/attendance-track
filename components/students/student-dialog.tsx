"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserPlus, UserCheck, Phone, StickyNote, X, Plus, Sparkles } from "lucide-react"

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
    <div 
      className="fixed inset-0 z-50 animate-in fade-in duration-200" 
      aria-modal="true" 
      role="dialog" 
      onClick={onOverlayClick}
    >
      {/* Enhanced Backdrop with Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="w-full max-w-2xl rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-blue-200/50 animate-in zoom-in-95 duration-300" 
          dir="rtl"
        >
          {/* Modern Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-2xl px-6 pt-6 pb-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute left-4 top-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Content */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                {member ? (
                  <UserCheck className="w-8 h-8 text-white" />
                ) : (
                  <UserPlus className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  {member ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
                </h2>
                <p className="text-sm text-white/90 font-medium mt-1">
                  {member ? "قم بتحديث المعلومات أدناه" : "أدخل بيانات الطالب الجديد"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="أدخل اسم الطالب..."
                required 
                className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
              />
            </div>

            {/* Phone Numbers Section */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Phone className="h-4 w-4 text-green-600" />
                أرقام الهاتف
              </label>

              {/* Phone Tags */}
              {phones.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200">
                  {phones.map((p, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <Phone className="h-3 w-3" />
                      {p}
                      <button
                        type="button"
                        onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                        className="mr-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:scale-110"
                        aria-label="حذف الرقم"
                        title="حذف الرقم"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Phone Input */}
              <div className="flex gap-2 flex-row-reverse">
                <input
                  className="h-12 flex-1 w-full rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  onKeyDown={handlePhoneDraftKeyDown}
                  placeholder="01234567890"
                  type="tel"
                />
                <button 
                  type="button" 
                  onClick={addPhoneFromDraft} 
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة
                </button>
              </div>

              <p className="text-xs text-gray-500 text-end bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                💡 اضغط <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Enter</kbd> لإضافة الرقم سريعاً
              </p>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label htmlFor="notes" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <StickyNote className="h-4 w-4 text-amber-600" />
                ملاحظات إضافية
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أي ملاحظات هنا..."
                rows={4}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
              <button 
                type="button" 
                onClick={() => onOpenChange(false)} 
                className="h-12 px-6 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                {member ? (
                  <>
                    <UserCheck className="h-5 w-5" />
                    حفظ التعديلات
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    إضافة الطالب
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
