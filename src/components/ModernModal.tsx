import React from 'react';
import { X, LucideIcon } from 'lucide-react';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = '4xl'
}) => {
  if (!isOpen) return null;

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthClass} w-full max-h-[90vh] overflow-hidden`}>
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center ring-2 ring-white/50">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{title}</h2>
                <p className="text-emerald-50 text-sm">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center transition-all duration-200 hover:rotate-90"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          {children}
        </div>

        {footer && (
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernModal;
