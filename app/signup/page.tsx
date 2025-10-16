"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, UserPlus, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة")
      return
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      return
    }

    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Insert into users table
        const { error: dbError } = await supabase.from("users").insert({
          id: authData.user.id,
          name: name,
          email: email,
        })

        if (dbError) throw dbError

        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 border-white/50 bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-t-xl pb-8 px-6">
          <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2 shadow-lg border-2 border-white/30">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-black">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-base md:text-lg text-white/90 font-semibold">
            🌟 انضم إلى نظام إدارة الحضور
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8">
          {error && (
            <Alert variant="destructive" className="mb-4 border-2 animate-shake">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-2 border-green-300 shadow-lg">
              <AlertDescription className="font-semibold">✅ تم إنشاء الحساب بنجاح! جاري التحويل...</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required
                  disabled={loading}
                  className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  disabled={loading}
                  className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-gray-700">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  required
                  disabled={loading}
                  className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  disabled={loading}
                  className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-solid border-white border-r-transparent"></div>
                  <span>جاري الإنشاء...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span>إنشاء حساب</span>
                </div>
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600 font-medium">
                لديك حساب بالفعل؟{" "}
                <Link 
                  href="/login" 
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
