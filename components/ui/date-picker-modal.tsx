"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

type DatePickerModalProps = {
  value: string | undefined
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined
  const parts = value.split("-")
  if (parts.length !== 3) return undefined
  const [y, m, d] = parts.map((p) => Number(p))
  if (!y || !m || !d) return undefined
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return isNaN(dt.getTime()) ? undefined : dt
}

function toIsoDateString(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function DatePickerModal({ value, onChange, label, placeholder = "اختر تاريخًا", disabled, className }: DatePickerModalProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => parseIsoDate(value), [value])

  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn("w-full justify-between", className)}
    >
      <span className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-blue-600" />
        {label && <span className="text-sm text-gray-600">{label}</span>}
      </span>
      <span className={cn("text-sm", !value && "text-muted-foreground")}>{value ? format(selected!, "yyyy-MM-dd") : placeholder}</span>
    </Button>
  )

  const content = (
    <div className="p-0">
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-t-lg">
        <div className="text-sm opacity-90">{label || "اختر التاريخ"}</div>
        <div className="text-lg font-semibold">{selected ? format(selected, "EEEE, dd MMM yyyy") : placeholder}</div>
      </div>
      <div className="p-3">
        <Calendar
        mode="single"
        selected={selected}
        onSelect={(d) => {
          if (d) {
            onChange(toIsoDateString(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))))
            setOpen(false)
          }
        }}
        className="mx-auto"
      />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-lg p-0">
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 overflow-hidden">
        {content}
      </DialogContent>
    </Dialog>
  )
}

export default DatePickerModal


