import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface CustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  initialValue?: string;
  placeholder?: string;
}

const CustomPromptModal: React.FC<CustomPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  initialValue = '',
  placeholder = '',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedText, setSelectedText] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setSelectedText('');
      setShowLinkInput(false);
      setLinkUrl('');
      // Focus the textarea when the modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleTextSelection = () => {
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = inputValue.substring(start, end);
      setSelectedText(selected);
    }
  };

  const handleMakeLink = () => {
    if (selectedText && linkUrl) {
      const textarea = inputRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = inputValue.substring(0, start);
        const after = inputValue.substring(end);
        const linkText = `<a href="${linkUrl}">${selectedText}</a>`;
        const newValue = before + linkText + after;
        setInputValue(newValue);
        setShowLinkInput(false);
        setLinkUrl('');
        setSelectedText('');
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative bg-white max-w-lg w-full mx-4 rounded shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-medium text-gray-900">{title}</div>
          <button onClick={onClose} className="btn btn-secondary bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm">Close</button>
        </div>
        <div className="p-4 text-gray-900">
          <p className="text-sm text-gray-700 mb-4">{message}</p>

          <div className="mb-4">
            <textarea
              ref={inputRef}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 resize-none"
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onSelect={handleTextSelection}
              placeholder={placeholder}
            />
          </div>

          {selectedText && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <p className="text-sm text-indigo-700 mb-2">
                Selected: <span className="font-medium">"{selectedText}"</span>
              </p>
              {!showLinkInput ? (
                <button
                  type="button"
                  className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowLinkInput(true)}
                >
                  Make Link
                </button>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="url"
                    className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter URL..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleMakeLink}
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkUrl('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
};

export default CustomPromptModal;
