import { Toast } from './toast';

export function ToastContainer({ toasts, onClose }) {
  // Show only the last 3 toasts
  const visibleToasts = toasts.slice(-3);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
