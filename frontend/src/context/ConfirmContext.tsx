'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

type ConfirmContextType = {
  confirm: (message: string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolveFn, setResolveFn] = useState<((val: boolean) => void) | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const confirm = (msg: string) => {
    setMessage(msg);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCancel}
          />
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_20px_50px_rgba(15,23,42,0.15)] animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{t('confirm') || 'Confirm'}</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                {message}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleCancel} 
                  className="flex-1 py-3.5 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-bold transition-colors border border-slate-200"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handleConfirm} 
                  className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  {t('confirm') || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
