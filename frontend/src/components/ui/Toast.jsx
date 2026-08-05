import React, { useState, createContext, useContext } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
      removeToast: () => {},
    };
  }
  return context;
}

function Toast({ id, message, type, onClose }) {
  return (
    <div className={`animate-slide-in flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-md ${
      type === 'success' ? 'bg-green-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      type === 'warning' ? 'bg-yellow-600 text-white' :
      'bg-blue-600 text-white'
    }`}>
      {type === 'success' && <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />}
      {type === 'error' && <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />}
      {type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />}
      {type === 'info' && <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white transition-opacity">
        ✕
      </button>
    </div>
  );
}