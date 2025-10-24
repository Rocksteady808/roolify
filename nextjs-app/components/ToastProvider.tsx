"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; title?: string; message: string };

type ToastContextValue = {
  addToast: (t: { type?: ToastType; title?: string; message: string }) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // cleanup on unmount
    return () => setToasts([]);
  }, []);

  const addToast = (t: { type?: ToastType; title?: string; message: string }) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const toast: Toast = { id, type: t.type || "info", title: t.title, message: t.message };
    setToasts((s) => [toast, ...s]);
    // auto remove
    window.setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
    return id;
  };

  const removeToast = (id: string) => setToasts((s) => s.filter((x) => x.id !== id));

  const value = useMemo(() => ({ addToast, removeToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-80 max-w-sm transform transition-all duration-300 ease-in-out bg-white border rounded-lg shadow-lg p-4 flex items-center gap-3 text-sm ${
              t.type === "success" ? "border-green-200 bg-green-50" : t.type === "error" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
            }`}
            role="status"
          >
            <div className="flex-shrink-0">
              {t.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                </svg>
              ) : t.type === "error" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11V5a1 1 0 10-2 0v2a1 1 0 102 0zm-1 4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm9-4a1 1 0 10-2 0v1a1 1 0 102 0V6zm-1 3a1 1 0 00-.993.883L9 10v3a1 1 0 001.993.117L11 13v-3a1 1 0 00-1-1z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && <div className="font-medium text-gray-900 mb-1">{t.title}</div>}
              <div className="text-gray-700 leading-relaxed">{t.message}</div>
            </div>

            <button 
              onClick={() => removeToast(t.id)} 
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100" 
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within a ToastProvider");
  return ctx;
}
