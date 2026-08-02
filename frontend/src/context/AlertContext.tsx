import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, X } from 'lucide-react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, type?: AlertType, title?: string) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (message: string, type: AlertType = 'info', title?: string) => {
    const defaultTitles: Record<AlertType, string> = {
      success: 'Success',
      warning: 'Notice',
      error: 'Error',
      info: 'Information',
    };
    setAlertState({
      isOpen: true,
      title: title || defaultTitles[type],
      message,
      type,
      isConfirm: false,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, type: AlertType = 'warning', title = 'Confirm Action') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      isConfirm: true,
      onConfirm,
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Global override for window.alert so legacy/native alerts use the themed centered modal
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      const messageStr = String(msg || '');
      let type: AlertType = 'info';
      if (messageStr.toLowerCase().includes('success') || messageStr.toLowerCase().includes('approved') || messageStr.toLowerCase().includes('saved')) {
        type = 'success';
      } else if (messageStr.toLowerCase().includes('error') || messageStr.toLowerCase().includes('failed')) {
        type = 'error';
      } else if (messageStr.toLowerCase().includes('warning') || messageStr.toLowerCase().includes('alert') || messageStr.toLowerCase().includes('notice')) {
        type = 'warning';
      }
      showAlert(messageStr, type);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const getIcon = () => {
    switch (alertState.type) {
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-rose-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-cyan-400" />;
    }
  };

  const getGlowColor = () => {
    switch (alertState.type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.25)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.25)';
      case 'error':
        return 'rgba(244, 63, 94, 0.25)';
      default:
        return 'rgba(6, 182, 212, 0.25)';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
      {children}

      {/* CENTERED THEME-AWARE POPUP MODAL */}
      {alertState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(3, 5, 13, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
          onClick={closeAlert}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: `0 24px 60px ${getGlowColor()}, 0 4px 20px rgba(0, 0, 0, 0.4)`,
              padding: '28px 24px 24px',
              textAlign: 'center',
              color: 'var(--text-primary)',
              animation: 'zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Icon */}
            <button
              onClick={closeAlert}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--nav-hover-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={16} />
            </button>

            {/* Icon Header */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: 'var(--nav-active-bg)',
                border: '1px solid var(--nav-active-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {getIcon()}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              {alertState.title}
            </h3>

            {/* Message Body */}
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 24px',
                wordBreak: 'break-word',
              }}
            >
              {alertState.message}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {alertState.isConfirm && (
                <button
                  onClick={() => {
                    closeAlert();
                    if (alertState.onCancel) alertState.onCancel();
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    borderRadius: '100px',
                    border: '1px solid var(--border-default)',
                    background: 'var(--nav-hover-bg)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  closeAlert();
                  if (alertState.onConfirm) alertState.onConfirm();
                }}
                style={{
                  flex: 1,
                  padding: '11px 22px',
                  borderRadius: '100px',
                  border: 'none',
                  background: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px var(--accent-glow)',
                }}
              >
                {alertState.isConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
