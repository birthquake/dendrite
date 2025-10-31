import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer } from './toast-container';

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type, message, duration) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = {
      id,
      type,
      message,
      duration,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const success = useCallback(
    (message, duration = 3000) => {
      showToast('success', message, duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message, duration) => {
      // If duration provided, it's a validation error (auto-dismiss)
      // If no duration, it's a critical error (stays until dismissed)
      showToast('error', message, duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message, duration = 3000) => {
      showToast('info', message, duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message, duration = 3000) => {
      showToast('warning', message, duration);
    },
    [showToast]
  );

  const value = {
    showToast,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
