"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && mounted) {
      // Trigger confetti animation
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      // Auto close after 4 seconds
      const timeout = setTimeout(() => {
        onClose()
      }, 4000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isOpen, mounted, onClose])

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-blue-200 bg-white p-0 overflow-hidden">
        <DialogTitle className="sr-only">Welcome</DialogTitle>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative p-8 text-center bg-blue-50"
        >
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="mb-6 relative"
          >
            <div className="text-8xl">👋</div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold text-blue-600" dir="rtl">
              ازيك يا {userName}
            </h2>
            <p className="text-gray-700 text-lg font-medium" dir="rtl">
              أهلاً وسهلاً بيك! 🎉
            </p>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

