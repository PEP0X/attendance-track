"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WelcomeModal } from "@/components/ui/welcome-modal"
import { LogIn, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  // Prefetch dashboard for faster redirect after login
  useEffect(() => {
    try {
      router.prefetch("/dashboard")
    } catch {}
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Fetch user name from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name")
          .eq("id", data.user.id)
          .single()

        if (!userError && userData) {
          setUserName(userData.name)
          setShowWelcome(true)
          // Redirect to dashboard after modal closes
          setTimeout(() => {
            router.push("/dashboard")
            router.refresh()
          }, 4500)
        } else {
          router.push("/dashboard")
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} userName={userName} />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 border-white/50 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-xl py-8 px-6 ">
            <CardTitle className="text-2xl md:text-3xl font-black leading-tight">
              مدرسة الأرشيدياكون حبيب جرجس
            </CardTitle>
            <CardDescription className="text-base md:text-lg text-white/90 font-semibold">
              ⚡ نظام إدارة الحضور
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-2 animate-shake">
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="servant@example.com"
                    required
                    disabled={loading}
                    className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
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
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="pr-11 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-solid border-white border-r-transparent"></div>
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    <span>تسجيل الدخول</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
