"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
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
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مستخدم
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{users.length}</p>
            <p className="text-gray-600 mt-1">إجمالي المستخدمين</p>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} onDelete={handleDelete} />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">لا توجد نتائج</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
    </div>
  )
}
