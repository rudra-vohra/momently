import { useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * Modal — Momently Design System
 * Warm cream card, Level 3 shadow, backdrop blur overlay
 * Features pop-in and pop-out card animations.
 */
export default function Modal({ isOpen, onClose, children, className = '' }) {
  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  useEffect(() => {
    if (isMounted && !isExiting) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMounted, isExiting])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting) triggerClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isMounted, isExiting, triggerClose])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
          isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={triggerClose}
      />
      {/* Modal Content */}
      <div
        className={`
          relative z-10 w-full max-w-lg
          bg-surface rounded-2xl
          shadow-lg
          p-8
          ${isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * ModalCloseButton — X button for modal header
 */
export function ModalCloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-heading hover:bg-secondary/50 transition-colors cursor-pointer"
      aria-label="Close"
    >
      <span className="material-symbols-outlined text-[20px]">close</span>
    </button>
  )
}
