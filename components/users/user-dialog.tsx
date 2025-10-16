"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Mail, Lock, User, Sparkles } from "lucide-react"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: { name: string; email: string; password: string }) => void
}

export function UserDialog({ open, onOpenChange, onCreate }: UserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, email, password })
    setName("")
    setEmail("")
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border-2 border-purple-200 shadow-2xl sm:max-w-xl">
        <DialogHeader className="space-y-3 pb-4 border-b-2 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-purple-300">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700">
                إضافة مستخدم جديد
              </DialogTitle>
              <DialogDescription className="text-gray-600 font-medium mt-1">
                أدخل بيانات الخادم الجديد
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <User className="h-4 w-4 text-purple-600" />
              الاسم الكامل <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="أدخل اسم الخادم..."
              required 
              className="h-12 text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Mail className="h-4 w-4 text-blue-600" />
              البريد الإلكتروني <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="servant@example.com"
              required
              className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Lock className="h-4 w-4 text-green-600" />
              كلمة المرور <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل..."
              required
              minLength={6}
              className="h-12 text-base border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl"
            />
            <p className="text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              🔒 يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              إضافة المستخدم
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
