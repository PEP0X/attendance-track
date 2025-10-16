"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Phone, FileText } from "lucide-react"

interface Member {
  id: string
  name: string
  phone: string | null
  notes: string | null
}

interface StudentCardProps {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (id: string) => void
}

export function StudentCard({ member, onEdit, onDelete }: StudentCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 mt-0.5" />
                <span>{member.notes}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(member)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(member.id)}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
