import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  return (
    <div className={`toast-notification toast-${type}`}>
      <span className="toast-icon">
        {type === 'success' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="toast-svg">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="toast-svg">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
};
