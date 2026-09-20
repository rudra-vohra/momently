import { useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * SnapshotUpdatedModal — Success modal when published snapshot is updated.
 * Replaces browser alert() with warm Stitch styling (#FFF2DB / #BB0028)
 * and pop-in/pop-out card animations.
 */
export default function SnapshotUpdatedModal({
  isOpen,
  onClose,
  snapshotCount,
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
      aria-labelledby="snapshot-updated-title"
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

        {/* Success Icon */}
        <div className="w-12 h-12 rounded-full bg-[#FFE5BF] border border-[#F6D2B2] text-[#8C3A0A] flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <span className="material-symbols-outlined text-2xl text-[#8C3A0A]">photo_library</span>
        </div>

        {/* Heading */}
        <h2
          id="snapshot-updated-title"
          className="text-xl sm:text-2xl font-extrabold font-heading text-[#1A1817] tracking-tight mb-2"
        >
          Snapshot updated!
        </h2>

        {/* Body Description */}
        <p className="text-xs sm:text-sm text-[#66605B] leading-relaxed mb-6 px-1">
          {snapshotCount !== undefined ? (
            <>
              Published snapshot updated to <span className="font-bold text-[#1A1817]">{snapshotCount} {snapshotCount === 1 ? 'photo' : 'photos'}</span>. Your client gallery now displays the latest curated selections.
            </>
          ) : (
            <>
              Published snapshot updated with current selections! Your client gallery now displays the latest curated selections.
            </>
          )}
        </p>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={triggerClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#BB0028] hover:bg-[#F62440] text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:shadow-[0_4px_14px_rgba(246,36,64,0.28)] transition-all cursor-pointer active:scale-98"
          >
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  )
}
