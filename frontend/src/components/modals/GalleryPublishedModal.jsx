import { useState, useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * GalleryPublishedModal — Matches Stitch "Gallery published!" modal exactly
 * Appears after:
 * 1. Admin publishes gallery for the first time with the set PIN
 * 2. Admin changes the gallery PIN
 * Features pop-in and pop-out card animations.
 */
export default function GalleryPublishedModal({
  isOpen,
  onClose,
  gallerySlug = 'jennifer-wedding',
  pin = '4829',
  eventName = 'Jennifer Wedding',
}) {
  const [toastMessage, setToastMessage] = useState('')
  const [copyUrlLabel, setCopyUrlLabel] = useState('Copy')
  const [copyPinLabel, setCopyPinLabel] = useState('Copy')
  const [bundleBtnLabel, setBundleBtnLabel] = useState('Copy link & PIN')

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

  const displayUrl =
    typeof window !== 'undefined' && window.location.host
      ? `${window.location.host}/gallery/${gallerySlug}`
      : `momently.app/gallery/${gallerySlug}`

  const shareUrl =
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/gallery/${gallerySlug}`
      : `https://momently.app/gallery/${gallerySlug}`

  const pinDisplay = pin.toString().split('').join(' ')

  const bundleMessage = `Your ${eventName} gallery is ready!\n\nLink: ${shareUrl}\nAccess PIN: ${pin}\n\nEnjoy browsing and downloading your high-res photos!`

  let toastTimer = null
  const showFeedback = (msg) => {
    setToastMessage(msg)
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }

  const copyToClipboard = (text, successMsg, setLabel, originalLabel) => {
    const doFeedback = () => {
      showFeedback(successMsg)
      if (setLabel) {
        setLabel('Copied!')
        setTimeout(() => setLabel(originalLabel), 1800)
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
        fallbackCopy(text, doFeedback)
      })
    } else {
      fallbackCopy(text, doFeedback)
    }
  }

  const fallbackCopy = (text, callback) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      callback()
    } catch {
      callback()
    }
  }

  const handleCopyUrl = () => {
    copyToClipboard(shareUrl, 'Gallery link copied!', setCopyUrlLabel, 'Copy')
  }

  const handleCopyPin = () => {
    copyToClipboard(pin, `Client PIN (${pin}) copied!`, setCopyPinLabel, 'Copy')
  }

  const handleCopyBundle = () => {
    copyToClipboard(bundleMessage, 'Link & PIN ready to share!', setBundleBtnLabel, 'Copy link & PIN')
  }

  return (
    <div
      id="gallery-published-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[rgba(20,10,10,0.48)] backdrop-blur-md transition-opacity overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting) triggerClose()
      }}
    >
      {/* Modal Card (#FFF2DB Light Cream with warm tactile shadow) */}
      <div
        className={`relative w-full max-w-[460px] bg-[#FFF2DB] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(40,15,5,0.22),0_8px_20px_-4px_rgba(40,15,5,0.12)] border border-[#F0DFC8] transition-all my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Top Close Button */}
        <button
          id="btn-close-modal"
          type="button"
          onClick={triggerClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#7A6F68] hover:text-[#1F1916] hover:bg-[#FFE5BF] transition-all focus:outline-none focus:ring-2 focus:ring-[#F62440] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* 1. Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(16,185,129,0.35)] ring-4 ring-[#10B981]/20 mb-3.5">
            <svg
              className="w-6 h-6 stroke-[3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4.5 12.75l6 6 9-13.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 2. Heading */}
          <h2
            id="modal-heading-title"
            className="font-headline-md text-2xl font-bold text-[#1F1916] tracking-tight"
          >
            Gallery published!
          </h2>

          {/* 3. Subtext */}
          <p className="font-body-sm text-sm leading-relaxed text-[#7A6F68] max-w-sm mt-1.5 px-2">
            Share this link and PIN with your client. For security, the PIN won't be shown again after you close this.
          </p>
        </div>

        {/* Content Sections */}
        <div className="mt-6 flex flex-col gap-4">
          {/* 4. Gallery Link Section */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="input-gallery-link"
              className="font-label-sm text-xs font-semibold text-[#5A4F48] tracking-wider uppercase"
            >
              Gallery link
            </label>
            <div className="bg-[#FFE5BF] rounded-xl p-2.5 sm:p-3 px-3.5 sm:px-4 flex items-center justify-between gap-2 border border-[#F3DFC5]">
              <span
                id="gallery-url-text"
                className="font-code-sm font-mono text-xs sm:text-sm text-[#1F1916] font-medium truncate select-all"
              >
                {displayUrl}
              </span>
              <button
                id="btn-copy-url"
                type="button"
                onClick={handleCopyUrl}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF2DB] hover:bg-white text-[#1F1916] border border-[#E9D1B5] font-label-sm text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span id="copy-url-label">{copyUrlLabel}</span>
              </button>
            </div>
          </div>

          {/* 5. PIN Section */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="font-label-sm text-xs font-semibold text-[#5A4F48] tracking-wider uppercase">
              PIN
            </label>
            <div className="bg-[#FFE5BF] rounded-xl p-2.5 sm:p-3 px-3.5 sm:px-4 flex items-center justify-between gap-2 border border-[#F3DFC5]">
              <div className="flex items-center gap-2">
                <span
                  id="pin-digits-text"
                  className="font-code-sm font-mono text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#1F1916] select-all"
                >
                  {pinDisplay}
                </span>
              </div>
              <button
                id="btn-copy-pin"
                type="button"
                onClick={handleCopyPin}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF2DB] hover:bg-white text-[#1F1916] border border-[#E9D1B5] font-label-sm text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span id="copy-pin-label">{copyPinLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Toast inside modal for instant feedback */}
        {toastMessage && (
          <div
            id="copy-toast"
            className="my-3 py-1.5 px-3 bg-[#10B981]/15 text-[#065F46] rounded-full text-center font-label-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span id="copy-toast-msg">{toastMessage}</span>
          </div>
        )}

        {/* 6. Primary Action Button (Copy link & PIN bundle) */}
        <button
          id="btn-copy-bundle"
          type="button"
          onClick={handleCopyBundle}
          className="w-full mt-5 py-3.5 px-6 rounded-full font-headline-sm font-bold text-sm sm:text-base text-white active:bg-[#BF122A] shadow-[0_4px_14px_rgba(246,36,64,0.3)] transition-all flex items-center justify-center gap-2 select-none bg-primary hover:bg-[#F62440] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span id="bundle-btn-label">{bundleBtnLabel}</span>
        </button>

        {/* 7. Secondary Action (Done) */}
        <div className="flex justify-center mt-2.5">
          <button
            id="btn-dismiss-done"
            type="button"
            onClick={triggerClose}
            className="font-label-md text-sm font-medium text-[#7A6F68] hover:text-[#1F1916] py-1.5 px-5 rounded-full hover:bg-[#FFE5BF]/60 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
