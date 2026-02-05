'use client'

import { useState, useCallback } from 'react'

type NotifType = 'ok' | 'err' | 'info'

interface Notif {
  id: number
  message: string
  type: NotifType
}

let notifId = 0

export function useNotification() {
  const [notifications, setNotifications] = useState<Notif[]>([])

  const notify = useCallback((message: string, type: NotifType = 'info') => {
    const id = ++notifId
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 2800)
  }, [])

  return { notifications, notify }
}

const typeStyles: Record<NotifType, string> = {
  ok: 'bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.25)] text-grn',
  err: 'bg-[rgba(239,68,68,0.15)] border-[rgba(239,68,68,0.25)] text-red',
  info: 'bg-[rgba(80,210,193,0.15)] border-[rgba(80,210,193,0.25)] text-acc',
}

export function NotificationContainer({ notifications }: { notifications: Notif[] }) {
  return (
    <div className="fixed top-[48px] right-[14px] z-[999] flex flex-col gap-[5px] pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`py-2 px-3.5 rounded-[5px] text-[11px] font-semibold pointer-events-auto max-w-[280px] backdrop-blur-[10px] border animate-[nIn_0.25s,nOut_0.25s_2.5s_forwards] ${typeStyles[n.type]}`}
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}
