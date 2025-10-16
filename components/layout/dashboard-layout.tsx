"use client"

import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ClipboardList, Users, BarChart3, UserCog, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

const navItems = [
  { href: "/dashboard", label: "تسجيل الحضور", icon: ClipboardList },
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
    const routesToPrefetch = ["/dashboard", "/students", "/reports", "/users"]
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 border-b border-blue-700 sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-blue-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-bold text-white">مستوى الثاني (رابعة وخامسة وسادسة) </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-blue-700">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-l border-gray-200 min-h-[calc(100vh-73px)] shadow-sm">
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
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-blue-600">القائمة</h2>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
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
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
