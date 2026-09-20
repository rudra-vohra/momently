import { useState, useRef, useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * ChangePinModal — Dedicated operation to update the gallery PIN without republishing.
 * Adheres strictly to rule 10 & 27: snapshot remains unchanged.
 * Features pop-in and pop-out card animations.
 */
export default function ChangePinModal({
  isOpen,
  onClose,
  onChangePin,
}) {
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
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
      await onChangePin?.(pin)
      triggerClose()
    } catch (err) {
      setError(err.message || 'Failed to change PIN.')
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
        className={`relative w-full max-w-sm bg-[#FFF2DB] rounded-[20px] p-6 sm:p-8 shadow-2xl border border-[#EADAC5] text-[#1A1817] my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        <button
          type="button"
          onClick={triggerClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#706862] hover:text-[#1A1817] hover:bg-[#FFE5BF] transition-colors focus:outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-[#FFE5BF] text-primary flex items-center justify-center mb-3 shadow-xs">
          <span className="material-symbols-outlined text-xl">key</span>
        </div>

        <h2 className="text-xl font-bold font-heading text-[#1A1817] tracking-tight mb-1">
          Change Client PIN
        </h2>
        <p className="text-xs text-[#66605B] mb-5">
          Enter a new 4-digit PIN for client gallery access. The published photo snapshot will remain unchanged.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 flex items-start gap-2 text-left">
            <span className="material-symbols-outlined text-[#ba1a1a] text-lg leading-none mt-0.5 select-none">
              error
            </span>
            <p className="font-body text-xs text-[#ba1a1a] leading-tight flex-1 font-medium">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#1A1817]">New 4-digit PIN</span>
            <button
              type="button"
              onClick={handleSuggestPin}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              Suggest PIN
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
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
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={triggerClose}
              className="flex-1 py-2.5 rounded-xl border border-[#D9CEBF] bg-[#FFF2DB] hover:bg-[#FFE5BF] text-xs font-semibold text-[#1A1817] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pinDigits.join('').length !== 4 || isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
