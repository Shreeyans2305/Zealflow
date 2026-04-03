import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, children }) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      // Slight delay to allow DOM to paint before triggering transition
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = '';
      }, 140); // 140ms ease-in for closing
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <ModalOverlay isVisible={isVisible} onClose={onClose}>
      <ModalPanel isVisible={isVisible} ref={modalRef} onClose={onClose}>
        {children}
      </ModalPanel>
    </ModalOverlay>,
    document.body
  );
}

export function ModalOverlay({ isVisible, onClose, children }) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,27,25,0.45)] backdrop-blur-[6px] transition-opacity ${
        isVisible ? 'opacity-100 duration-180 ease-out' : 'opacity-0 duration-140 ease-in'
      }`}
    >
      {children}
    </div>
  );
}

export function ModalPanel({ isVisible, onClose, children, ref }) {
  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={`bg-[#FFFFFF] rounded-[16px] p-8 max-w-[480px] w-[calc(100%-48px)] mx-auto shadow-[0_24px_64px_rgba(0,0,0,0.12)] transition-transform ${
        isVisible ? 'scale-100 duration-180 ease-out' : 'scale-[0.97] duration-140 ease-in'
      }`}
    >
      {children}
    </div>
  );
}

export function ModalHeader({ title, onClose }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="display-font text-[20px] text-[#1C1B19] m-0">{title}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-[8px] text-[#6B6860] hover:bg-[#EEECEA] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children }) {
  return (
    <div className="overflow-y-auto max-h-[60vh] text-[15px] -mx-2 px-2">
      {children}
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="mt-6 pt-5 border-t border-[var(--color-border-warm)] flex gap-2 justify-end">
      {children}
    </div>
  );
}
