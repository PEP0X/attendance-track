'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // next-pwa auto-registers when register: true, this is for extra UX like updates
    const onControllerChange = () => {
      // When a new SW takes control, reload to get the fresh assets
      // This mirrors the common UX recommendation
      if (document.visibilityState === 'visible') {
        window.location.reload()
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}


