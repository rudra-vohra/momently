import { useState, useEffect } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * GallerySettingsModal — Matches Stitch "momently_gallery_settings_modal_version_b"
 * NOTE: As per product rules, REVEAL PIN IS NEVER IMPLEMENTED (backend hashes the PIN).
 * Dedicated Change PIN action opens the Change PIN flow.
 * Features pop-in and pop-out card animations, and loading state for snapshot updates.
 */
export default function GallerySettingsModal({
  isOpen,
  onClose,
  gallerySlug = 'sharma-a3f9c2',
  publishedDate = '14 Sep',
  snapshotCount = 8,
  unpublishedCount = 4,
  isUpdatingSnapshot = false,
  onUpdateSnapshot,
  onChangePinClick,
  onUnpublish,
}) {
  const [copiedLink, setCopiedLink] = useState(false)

  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting && !isUpdatingSnapshot) {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, isExiting, isUpdatingSnapshot, triggerClose])

  if (!isMounted) return null

  const displayUrl =
    typeof window !== 'undefined' && window.location.host
      ? `${window.location.host}/gallery/${gallerySlug}`
      : `momently.app/gallery/${gallerySlug}`

  const shareUrl =
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/gallery/${gallerySlug}`
      : `https://momently.app/gallery/${gallerySlug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1817]/60 backdrop-blur-sm overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting && !isUpdatingSnapshot) triggerClose()
      }}
    >
      {/* Modal Card (Version B: Already Published / Gallery Settings) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-b"
        className={`relative w-full max-w-lg bg-[#FFF2DB] rounded-[20px] p-6 sm:p-8 shadow-2xl border border-[#EADAC5] text-[#1A1817] my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Close Button ("X") */}
        <button
          type="button"
          onClick={triggerClose}
          disabled={isUpdatingSnapshot}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#706862] hover:text-[#1A1817] hover:bg-[#FFE5BF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F62440] cursor-pointer disabled:opacity-50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Gallery Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DEF7EC] border border-[#B9ECCE] text-xs font-semibold text-[#03543F] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          Gallery Live
        </div>

        {/* Modal Heading */}
        <h2
          id="modal-title-b"
          className="text-2xl sm:text-[26px] font-extrabold font-heading text-[#1A1817] tracking-tight mb-1.5"
        >
          Gallery settings
        </h2>

        {/* Status line in JetBrains Mono */}
        <p className="text-xs sm:text-[13px] font-mono text-[#66605B] mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span>Live since {publishedDate}</span>
          <span>•</span>
          <span>{snapshotCount} photos</span>
          {unpublishedCount > 0 && (
            <>
              <span>•</span>
              <span className="text-[#F62440] font-bold bg-[#FFE5BF]/70 px-2 py-0.5 rounded-md">
                {unpublishedCount} unpublished changes
              </span>
            </>
          )}
        </p>

        {/* Share Link Section */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#5A534E] uppercase tracking-wider mb-1.5">
            Share link
          </label>
          <div className="flex items-center justify-between bg-[#FFE5BF] rounded-xl px-4 py-2.5 border border-[#E6D0B4] group hover:border-[#D6BEA0] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <svg
                className="w-4 h-4 text-[#8C3A0A] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="font-mono text-xs sm:text-sm text-[#1A1817] truncate select-all font-medium">
                {displayUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#BB0028] hover:text-[#F62440] transition-colors flex-shrink-0 px-2.5 py-1 rounded-lg hover:bg-[#FFF2DB]/80 cursor-pointer"
            >
              {copiedLink ? (
                <svg
                  className="w-3.5 h-3.5 text-[#059669]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row (Responsive: stacks gracefully on small screens) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Primary: Update snapshot */}
            <button
              type="button"
              disabled={isUpdatingSnapshot}
              onClick={onUpdateSnapshot}
              className="py-2.5 px-4 rounded-xl bg-[#BB0028] hover:bg-[#F62440] text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-[0_4px_14px_rgba(246,36,64,0.28)] active:scale-[0.98] disabled:opacity-75"
            >
              {isUpdatingSnapshot ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin leading-none">
                    progress_activity
                  </span>
                  <span>Updating snapshot...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Update snapshot</span>
                </>
              )}
            </button>

            {/* Secondary: Change PIN */}
            <button
              type="button"
              disabled={isUpdatingSnapshot}
              onClick={() => {
                triggerClose()
                onChangePinClick?.()
              }}
              className="py-2.5 px-3.5 rounded-xl border border-[#D9CEBF] bg-[#FFF2DB] hover:bg-[#FFE5BF] font-medium text-xs sm:text-sm text-[#1A1817] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <svg
                className="w-3.5 h-3.5 text-[#6B625B]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Change PIN
            </button>
          </div>

          {/* Destructive Action: Unpublish (right-aligned / separated) */}
          <button
            type="button"
            disabled={isUpdatingSnapshot}
            onClick={() => {
              triggerClose()
              onUnpublish?.()
            }}
            className="py-2 px-3 text-xs sm:text-sm font-semibold text-[#C41C35] hover:text-[#91051D] hover:bg-[#FFE5BF]/50 rounded-lg transition-colors flex items-center justify-center sm:justify-end gap-1 cursor-pointer disabled:opacity-50"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            Unpublish
          </button>
        </div>
      </div>
    </div>
  )
}
