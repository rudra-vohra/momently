import { useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * DeleteEventModal — Confirmation modal for deleting an event
 * Follows the warm cream (#FFF2DB) / crimson (#BB0028) design system,
 * enhanced with smooth pop-in and pop-out card animations.
 */
export default function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventName = 'Jennifer Wedding',
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
      aria-labelledby="delete-event-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1817]/60 backdrop-blur-sm overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting) triggerClose()
      }}
    >
      <div
        className={`relative w-full max-w-[420px] bg-[#FFF2DB] rounded-2xl sm:rounded-[20px] p-6 sm:p-7 shadow-2xl border border-[#EADAC5] text-[#1A1817] my-auto ${
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

        {/* Trash / Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-[#FFDAD8] border border-[#FFB3B1] text-[#BB0028] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <span className="material-symbols-outlined text-2xl text-[#BB0028]">delete_forever</span>
        </div>

        {/* Heading */}
        <h2
          id="delete-event-title"
          className="text-xl sm:text-2xl font-extrabold font-heading text-[#1A1817] tracking-tight mb-2 text-center"
        >
          Delete event?
        </h2>

        {/* Body Description */}
        <p className="text-xs sm:text-sm text-[#66605B] leading-relaxed text-center mb-6 px-1">
          Are you sure you want to delete <span className="font-bold text-[#1A1817]">"{eventName}"</span>? All photos, curated selections, and live client gallery access will be permanently removed. This action cannot be undone.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={triggerClose}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-[#D9CEBF] bg-[#FFF2DB] hover:bg-[#FFE5BF] font-medium text-xs sm:text-sm text-[#1A1817] transition-colors flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#BB0028] hover:bg-[#F62440] text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:shadow-[0_4px_14px_rgba(246,36,64,0.28)] transition-all cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
            <span>Delete Event</span>
          </button>
        </div>
      </div>
    </div>
  )
}
