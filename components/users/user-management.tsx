"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Users as UsersIcon } from "lucide-react"
import { UserCard } from "./user-card"
import { UserDialog } from "./user-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error("Error loading users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return

    try {
      // Delete from users table (auth.users will cascade)
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      setUsers((prev) => prev.filter((u) => u.id !== id))
      setMessage({ type: "success", text: "تم حذف المستخدم بنجاح" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حذف المستخدم" })
    }
  }

  const handleCreate = async (data: { name: string; email: string; password: string }) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            name: data.name,
            email: data.email,
            role: "servant",
          },
        ])

        if (profileError) throw profileError

        setMessage({ type: "success", text: "تم إضافة المستخدم بنجاح" })
        loadUsers()
        setDialogOpen(false)
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل إضافة المستخدم" })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-4 font-medium">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* Modern Sticky Header */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border-b-2 border-gray-200 shadow-lg rounded-b-2xl p-4 sm:p-5 space-y-4">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 text-center border-2 border-purple-300 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-purple-900">{users.length}</p>
                <p className="text-sm font-semibold text-purple-700">إجمالي المستخدمين</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="🔍 ابحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm"
            />
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-md hover:shadow-lg transition-all h-11"
          >
            <Plus className="h-5 w-5 ml-1" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
          <AlertDescription className="font-medium">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Users Grid */}
      <div className="max-w-6xl mx-auto grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 pb-8">
        {filteredUsers.length === 0 && (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold text-lg">لا توجد نتائج</p>
                <p className="text-sm text-gray-400 mt-1">جرب البحث بكلمات أخرى أو أضف مستخدم جديد</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} onDelete={handleDelete} />
        ))}
      </div>

      {/* Dialog */}
      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
    </div>
  )
}
