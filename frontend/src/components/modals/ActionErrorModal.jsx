import { useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * ActionErrorModal — Clean error modal to replace browser alert() for operation failures.
 * Matches Stitch warm cream styling and has pop-in/pop-out animations.
 */
export default function ActionErrorModal({
  isOpen,
  onClose,
  title = 'Action Failed',
  message,
}) {
  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting) {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, isExiting, triggerClose])

  if (!isMounted) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-error-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1817]/60 backdrop-blur-sm overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting) triggerClose()
      }}
    >
      <div
        className={`relative w-full max-w-[420px] bg-[#FFF2DB] rounded-2xl sm:rounded-[20px] p-6 sm:p-7 shadow-2xl border border-[#EADAC5] text-[#1A1817] my-auto text-center ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={triggerClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#706862] hover:text-[#1A1817] hover:bg-[#FFE5BF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F62440] cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>

        {/* Error Icon */}
        <div className="w-12 h-12 rounded-full bg-[#FFDAD8] border border-[#FFB3B1] text-[#BA1A1A] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <span className="material-symbols-outlined text-2xl text-[#BA1A1A]">error</span>
        </div>

        {/* Heading */}
        <h2
          id="action-error-title"
          className="text-xl sm:text-2xl font-extrabold font-heading text-[#1A1817] tracking-tight mb-2"
        >
          {title}
        </h2>

        {/* Error Message */}
        <p className="text-xs sm:text-sm text-[#66605B] leading-relaxed mb-6 px-1">
          {message || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={triggerClose}
            className="w-full py-2.5 px-4 rounded-xl border border-[#D9CEBF] bg-[#FFF2DB] hover:bg-[#FFE5BF] font-medium text-xs sm:text-sm text-[#1A1817] transition-colors flex items-center justify-center cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
