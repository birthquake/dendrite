import { useEffect } from 'react';
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import './toast.css';

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-100',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-100',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-100',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-100',
  },
};

export function Toast({ id, type, message, onClose, duration = 3000 }) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    // Don't auto-dismiss error toasts
    if (type === 'error') return;

    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, type, duration, onClose]);

  const classNames = [
    'toast-notification',
    'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
    'shadow-lg',
    'animate-in slide-in-from-right-full duration-300',
    'min-w-[320px] max-w-[420px]',
    config.bgColor,
    config.borderColor,
  ].join(' ');

  return (
    <div
      className={classNames}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium leading-relaxed ${config.textColor}`}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 rounded-md p-1 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 ${config.iconColor}`}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
