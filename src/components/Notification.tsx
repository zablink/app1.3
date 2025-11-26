// components/Notification.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number; // in milliseconds, default 5000 (5 seconds)
  onClose?: () => void;
}

export default function Notification({
  message,
  type = "info",
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start fade out animation 500ms before duration ends
    const fadeTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    // Call onClose after duration
    const closeTimer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      icon: CheckCircle,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      icon: XCircle,
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
      icon: AlertCircle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      icon: AlertCircle,
    },
  };

  const { bg, border, text, icon: Icon } = config[type];

  return (
    <div
      className={`
        p-4 ${bg} border ${border} rounded-lg flex items-center gap-3
        transition-all duration-300 ease-in-out
        ${isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
      `}
    >
      <Icon className={`${text} flex-shrink-0`} size={20} />
      <p className={`${text} flex-1`}>{message}</p>
      <button
        onClick={handleClose}
        className={`${text} hover:opacity-70 transition-opacity flex-shrink-0`}
        aria-label="ปิด"
      >
        <X size={18} />
      </button>
    </div>
  );
}
