"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Mail, Calendar } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

interface UserCardProps {
  user: User
  onDelete: (id: string) => void
}

export function UserCard({ user, onDelete }: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
              <Badge variant="secondary">{user.role === "admin" ? "مدير" : "خادم"}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>انضم في {new Date(user.created_at).toLocaleDateString("ar-EG")}</span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => onDelete(user.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
