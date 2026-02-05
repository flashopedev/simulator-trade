"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

let notificationId = 0;
const listeners = new Set<(n: Notification) => void>();

export function notify(message: string, type: NotificationType = "info") {
  const notification: Notification = {
    id: ++notificationId,
    message,
    type,
  };
  listeners.forEach((listener) => listener(notification));
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const listener = (n: Notification) => {
      setNotifications((prev) => [...prev, n]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      }, 2800);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed top-12 right-3 z-[999] flex flex-col gap-1.5 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "px-3.5 py-2 rounded text-[11px] font-semibold max-w-[280px] pointer-events-auto animate-slide-in backdrop-blur-sm",
            n.type === "success" &&
              "bg-grn/15 border border-grn/25 text-grn",
            n.type === "error" && "bg-red/15 border border-red/25 text-red",
            n.type === "info" && "bg-acc/15 border border-acc/25 text-acc"
          )}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
