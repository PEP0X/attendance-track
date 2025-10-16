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
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-3 sm:p-4 overflow-x-hidden">
        <Card className="w-full max-w-md shadow-lg border border-blue-200">
          <CardHeader className="space-y-2 text-center bg-blue-600 text-white rounded-t-lg pb-4 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold pt-2 sm:pt-3 leading-tight break-words">
              مدرسة الأرشيدياكون حبيب جرجس
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-blue-50 font-medium">
              نظام إدارة الحضور
            </CardDescription>
          </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="servant@example.com"
                required
                disabled={loading}
                className="text-right h-10 sm:h-auto text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="text-right h-10 sm:h-auto text-sm sm:text-base"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 sm:h-10 text-sm sm:text-base" 
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
