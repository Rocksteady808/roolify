import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black opacity-40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={`relative bg-white ${maxWidth === 'full' ? 'w-full h-full mx-0 my-0 rounded-none' : `${maxWidthClasses[maxWidth]} w-full mx-0 sm:mx-4 rounded-lg shadow-lg`} overflow-auto max-h-[90vh] sm:max-h-[95vh]`}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <div className="text-base sm:text-lg font-medium text-gray-900 truncate mr-2">{title}</div>
          <button onClick={onClose} className="btn btn-secondary bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm flex-shrink-0">
            Close
          </button>
        </div>
        <div className="p-3 sm:p-4 text-gray-900">
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
};

export default Modal;

