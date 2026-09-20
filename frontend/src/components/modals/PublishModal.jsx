import { useState, useRef, useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * PublishModal — Matches Stitch "momently_publish_gallery_modal_version_a" exactly.
 * Handles first-time gallery snapshot publishing with 4-digit PIN setup
 * and pop-in/pop-out card animations.
 */
export default function PublishModal({
  isOpen,
  onClose,
  onPublish,
  eventName = 'Jennifer Wedding',
  selectedCount = 12,
}) {
  const [pinDigits, setPinDigits] = useState(['4', '8', '2', '9'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting && !isSubmitting) {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, isExiting, isSubmitting, triggerClose])

  if (!isMounted) return null

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '')
    const newDigits = [...pinDigits]
    newDigits[index] = clean.slice(-1)
    setPinDigits(newDigits)

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleSuggestPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString()
    setPinDigits(randomPin.split(''))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const pin = pinDigits.join('')
    if (pin.length !== 4 || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onPublish?.(pin)
      triggerClose()
    } catch (err) {
      setError(err.message || 'Failed to publish gallery.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1817]/60 backdrop-blur-sm overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting && !isSubmitting) triggerClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md bg-[#FFF2DB] rounded-[20px] p-6 sm:p-8 shadow-2xl border border-[#EADAC5] text-[#1A1817] my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Close Button ("X") */}
        <button
          type="button"
          onClick={triggerClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#706862] hover:text-[#1A1817] hover:bg-[#FFE5BF] transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Badge / Context Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE5BF] text-xs font-semibold text-[#823307] mb-3">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {eventName} • First-time Publish
        </div>

        {/* Modal Heading */}
        <h2 className="text-2xl sm:text-[26px] font-extrabold font-heading text-[#1A1817] tracking-tight mb-2">
          Publish gallery
        </h2>

        {/* Body Copy */}
        <p className="text-sm text-[#66605B] leading-relaxed mb-6">
          Publishing creates a snapshot of the{' '}
          <span className="font-semibold text-[#1A1817]">
            {selectedCount} photos
          </span>{' '}
          you've selected. Your client will only see these.
        </p>

        {/* Snapshot Preview Mini Card */}
        <div className="mb-6 p-3 rounded-xl bg-[#FFE5BF]/70 border border-[#E8D4BC] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8C3A0A] text-base">
              photo_library
            </span>
            <span className="font-medium text-[#4D453F]">Snapshot contents:</span>
            <span className="font-bold text-[#1A1817] font-mono">
              {selectedCount} curated photos
            </span>
          </div>
          <span className={selectedCount === 0 ? "text-[#BB0028] font-semibold" : "text-[#8C3A0A] font-semibold"}>
            {selectedCount === 0 ? "Select photos first" : "Ready"}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 flex items-start gap-2 text-left">
            <span className="material-symbols-outlined text-[#ba1a1a] text-lg leading-none mt-0.5 select-none">
              error
            </span>
            <p className="font-body text-xs text-[#ba1a1a] leading-tight flex-1 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* PIN Input Section */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-semibold text-[#1A1817] tracking-wide">
                Set a 4-digit PIN
              </label>
              <button
                type="button"
                onClick={handleSuggestPin}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Suggest PIN
              </button>
            </div>

            {/* 4 Digit Boxes */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-[280px] sm:max-w-[300px] mx-auto">
              {pinDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full aspect-square text-center font-mono text-2xl font-bold rounded-xl bg-[#FFE5BF] border-2 border-transparent text-[#1A1817] transition-all shadow-inner focus:border-primary focus:outline-none"
                  aria-label={`PIN Digit ${index + 1}`}
                />
              ))}
            </div>

            <p className="text-center text-[11px] font-mono text-[#7D756F] mt-2.5">
              Clients will enter this PIN to unlock and view the gallery
            </p>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || pinDigits.join('').length !== 4 || selectedCount === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-heading font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
                <span>Publishing snapshot...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>Publish gallery</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
