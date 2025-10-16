"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Mail, Calendar, Shield, User } from "lucide-react"

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
  const isAdmin = user.role === "admin"
  
  return (
    <Card className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* User Name and Badge */}
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {isAdmin ? (
                  <Shield className="h-6 w-6 text-white" />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-lg text-gray-900 break-words">{user.name}</h3>
                  <Badge 
                    className={`${
                      isAdmin 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0' 
                        : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0'
                    } font-bold shadow-md`}
                  >
                    {isAdmin ? "🛡️ مدير" : "👤 خادم"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-200">
              <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-900 break-all">{user.email}</span>
            </div>

            {/* Join Date */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-xl border border-gray-200">
              <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                انضم في {new Date(user.created_at).toLocaleDateString("ar-EG", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Delete Button */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onDelete(user.id)}
            className="h-11 w-11 rounded-xl border-2 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
