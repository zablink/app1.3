// src/contexts/ToastContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Notification, { NotificationType } from "@/components/Notification";

interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: NotificationType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: NotificationType = "info", duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success", 5000);
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, "error", 6000);
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, "warning", 5000);
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info", 5000);
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <Notification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
