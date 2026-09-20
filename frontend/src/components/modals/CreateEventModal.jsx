import { useState, useEffect, useRef } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * CreateEventModal — Matches Stitch "Create new event" modal exactly.
 * Pure Tailwind CSS styling with keyboard (Escape) dismissal, backdrop click,
 * auto-focus, loading micro-interaction, and pop-in/pop-out card animations.
 */
export default function CreateEventModal({ isOpen, onClose, onCreateEvent }) {
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const nameInputRef = useRef(null)

  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  // Auto-focus and clear on modal open
  useEffect(() => {
    if (isOpen) {
      setEventName('')
      setDescription('')
      setError(null)
      setIsSubmitting(false)
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle Escape key to close modal
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!eventName.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onCreateEvent?.({
        name: eventName.trim(),
        description: description.trim(),
      })
      triggerClose()
    } catch (err) {
      setError(err.message || 'Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting && !isSubmitting) triggerClose()
      }}
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-opacity overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      {/* Centered Modal Window Card */}
      <div
        id="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-w-md w-full bg-[#FFF2DB] rounded-[20px] p-6 sm:p-8 shadow-2xl border border-[#FFE5BF]/60 relative z-50 my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Top Right Close Button */}
        <button
          id="close-modal-btn"
          type="button"
          onClick={triggerClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 rounded-full flex items-center justify-center text-[#5A504B] hover:text-[#1F1F1F] hover:bg-[#FFE5BF]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F62440]/30 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>

        {/* Modal Title & Header */}
        <div className="pr-8">
          <h2
            id="modal-title"
            className="font-heading font-bold text-2xl sm:text-[26px] text-[#1F1F1F] tracking-tight leading-snug"
          >
            Create new event
          </h2>
          <p className="font-body text-sm text-[#6B615B] mt-1 mb-6">
            Give your event a name to get started.
          </p>
        </div>

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

        {/* Modal Interactive Form */}
        <form id="create-event-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Field 1: Event Name */}
          <div>
            <label
              htmlFor="event-name"
              className="text-xs uppercase tracking-wider font-semibold text-[#3D3531] mb-1.5 block font-label-sm"
            >
              Event name
            </label>
            <input
              id="event-name"
              type="text"
              required
              autoComplete="off"
              ref={nameInputRef}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Sharma Wedding"
              className="w-full bg-[#FFE5BF] text-[#1F1F1F] placeholder-[#8C7D73] px-4 py-3 rounded-xl border border-transparent focus:border-[#F62440] focus:ring-2 focus:ring-[#F62440]/20 outline-none font-medium text-base transition-all font-body"
            >
            </input>
          </div>

          {/* Field 2: Description (Optional) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label
                htmlFor="event-description"
                className="text-xs uppercase tracking-wider font-semibold text-[#3D3531] font-label-sm"
              >
                Description
              </label>
              <span className="text-xs text-[#7A6F68] lowercase font-normal font-body">
                (optional)
              </span>
            </div>
            <textarea
              id="event-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this event"
              className="w-full bg-[#FFE5BF] text-[#1F1F1F] placeholder-[#8C7D73] px-4 py-3 rounded-xl border border-transparent focus:border-[#F62440] focus:ring-2 focus:ring-[#F62440]/20 outline-none font-medium text-sm sm:text-base resize-none transition-all font-body leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 mt-8">
            <button
              id="cancel-btn"
              type="button"
              onClick={triggerClose}
              className="border border-[#3D3531]/20 hover:border-[#3D3531]/40 text-[#3D3531] font-semibold px-5 py-2.5 rounded-full text-sm transition-colors text-center font-label-md focus:outline-none focus:ring-2 focus:ring-[#3D3531]/20 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-event-btn"
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F62440] hover:bg-[#BB0028] text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all text-center font-label-md flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#F62440]/40 disabled:opacity-75 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create event</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
