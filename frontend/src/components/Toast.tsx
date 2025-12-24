import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import '../styles/components/Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeClassMap: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
};

export default function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const Icon = iconMap[type];
  const typeClass = typeClassMap[type];

  return (
    <div className={`toast ${typeClass}`} role="alert" aria-live="polite">
      <div className="toast-content">
        <Icon className="toast-icon" aria-hidden="true" />
        <span className="toast-message">{message}</span>
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X className="toast-close-icon" aria-hidden="true" />
      </button>
    </div>
  );
}

