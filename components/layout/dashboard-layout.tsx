"use client"

import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ClipboardList, Users, BarChart3, UserCog, LogOut, Menu, X, Handshake } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

const navItems = [
  { href: "/dashboard", label: "تسجيل الحضور", icon: ClipboardList },
  { href: "/visitation", label: "نظام الافتقاد", icon: Handshake },
  { href: "/students", label: "إدارة الطلاب", icon: Users },
  { href: "/reports", label: "التقارير والإحصائيات", icon: BarChart3 },
  { href: "/users", label: "إدارة المستخدمين", icon: UserCog },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const loadRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
        setUserRole(data?.role ?? null)
      } catch {
        setUserRole(null)
      }
    }
    void loadRole()
  }, [supabase])

  useEffect(() => {
    // Proactively prefetch main routes to speed up navigation
    const routesToPrefetch = ["/dashboard", "/visitation", "/students", "/reports", "/users"]
    routesToPrefetch.forEach((path) => {
      try {
        router.prefetch(path)
      } catch {
        // ignore
      }
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl border-b-2 border-blue-200/50 sticky top-0 z-50 shadow-lg">
        <div className="flex flex-wrap items-center justify-between px-3 py-3 sm:px-4 lg:px-6 gap-y-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-blue-700 hover:bg-blue-100 hover:text-blue-900 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-base xs:text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 whitespace-nowrap truncate max-w-[55vw] xs:max-w-[70vw] sm:max-w-[200px] md:max-w-[350px]">
                مستوى الثاني
              </h1>
            </div>
          </div>
          <div className="flex-shrink-0 w-full flex justify-end lg:justify-end lg:w-auto mt-2 lg:mt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-rose-700 hover:bg-rose-100 hover:text-rose-900 w-full sm:w-auto font-bold rounded-xl transition-all"
            >
              <LogOut className="h-5 w-5 ml-2" />
              <span className="truncate">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop with Modern Design */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white/80 backdrop-blur-xl border-l-2 border-blue-200/50 min-h-[calc(100vh-73px)] shadow-xl">
          <nav className="flex-1 p-4 space-y-2">
            {navItems
              .filter((item) => (item.href === "/users" ? userRole === "admin" : true))
              .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold shadow-sm",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105" 
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:scale-105",
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    isActive ? "bg-white/20" : "bg-gray-100"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Modern Footer in Sidebar */}
          <div className="p-4 border-t-2 border-blue-200/50">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 text-center border-2 border-blue-300">
              <p className="text-sm font-bold text-blue-900">نظام إدارة الحضور</p>
              <p className="text-xs text-blue-700 mt-1">مدرسة حبيب جرجس</p>
            </div>
          </div>
        </aside>

        {/* Mobile Menu with Modern Design */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-l-2 border-blue-200/50 p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">القائمة</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:bg-blue-100 rounded-xl"
                >
                  <X className="h-6 w-6 text-blue-700" />
                </Button>
              </div>
              <nav className="space-y-2">
            {navItems
              .filter((item) => (item.href === "/users" ? userRole === "admin" : true))
              .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700",
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl",
                        isActive ? "bg-white/20" : "bg-gray-100"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content with Better Spacing */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
