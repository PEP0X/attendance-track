"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Phone, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  name: string
  phones: string[] | null
  notes: string | null
}

interface StudentCardProps {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (id: string) => void
}

export function StudentCard({ member, onEdit, onDelete }: StudentCardProps) {
  return (
    <Card className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Student Name with Icon */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg text-gray-900 break-words leading-tight">{member.name}</h3>
              </div>
            </div>

            {/* Phone Numbers */}
            {member.phones && member.phones.length > 0 && (
              <div className="flex items-start gap-2 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
                <Phone className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-2 text-sm">
                  {member.phones.map((p, i) => (
                    <span key={i} className="font-semibold text-green-700 bg-white px-2 py-1 rounded-md border border-green-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="flex items-start gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-xl border border-amber-200">
                <FileText className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-900 font-medium">{member.notes}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onEdit(member)}
              className="h-11 w-11 rounded-xl border-2 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onDelete(member.id)}
              className="h-11 w-11 rounded-xl border-2 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
