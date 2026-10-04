// Toast.jsx — Global toast notification system (replaces all alert() calls)
// Usage: import { useToast } from './Toast';  then const { showToast } = useToast();
// Wrap the app in <ToastProvider> in main.jsx or App.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                        role="alert"
                    >
                        <span className="toast-icon">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'warning' && '⚠️'}
                            {toast.type === 'info' && 'ℹ️'}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
