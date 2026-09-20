import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { galleriesService } from '../services/api'
import logoSrc from '../assets/images/momently-logo.png'

export default function GalleryLockedPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [galleryInfo, setGalleryInfo] = useState(null)
  const [secondsRemaining, setSecondsRemaining] = useState(300) // 5 minutes standard rate-limit window
  const initialSeconds = 300

  useEffect(() => {
    async function fetchInfo() {
      if (!slug) return
      try {
        const info = await galleriesService.getPublicGalleryInfo(slug)
        setGalleryInfo(info)
      } catch (err) {
        console.error('Failed to get gallery info:', err)
      }
    }
    fetchInfo()
  }, [slug])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  const progressPercent = (secondsRemaining / initialSeconds) * 100

  const eventTitle = galleryInfo?.event_name || 'Jennifer Wedding'
  const photosCount = galleryInfo?.photo_count ?? 12

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF3] text-[#1A1817] antialiased selection:bg-[#FFE5BF] selection:text-[#BB0028]">
      {/* Header (Compact & Small) */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFAF3]/90 backdrop-blur-sm border-b border-[#FFE5BF]/60 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-13 flex items-center justify-between">
          <Link to="/" aria-label="Momently Home" className="inline-flex items-center group focus:outline-none">
            <img
              src={logoSrc}
              alt="Momently"
              className="h-5.5 sm:h-6 w-auto transform group-hover:scale-105 transition-transform duration-200 cursor-pointer object-contain"
            />
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-stone-600 bg-[#FFE5BF]/40 px-2.5 py-0.5 rounded-full border border-[#FFE5BF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BB0028] animate-pulse" />
            <span>Protected Gallery</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Frosted Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 p-4 sm:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 opacity-30 scale-105 filter blur-md pointer-events-none select-none"
        >
          <div className="bg-gradient-to-tr from-[#fcd9be] to-[#ffe5c4] rounded-2xl aspect-[4/5] shadow-sm flex flex-col justify-end p-4">
            <div className="w-3/4 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#ffe2cb] to-[#fce4c8] rounded-2xl aspect-[4/5] shadow-sm flex flex-col justify-end p-4">
            <div className="w-1/2 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#f7cfb8] to-[#fddfc3] rounded-2xl aspect-[4/5] shadow-sm hidden sm:flex flex-col justify-end p-4">
            <div className="w-2/3 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#fedcb7] to-[#faedd9] rounded-2xl aspect-[4/5] shadow-sm hidden md:flex flex-col justify-end p-4">
            <div className="w-3/5 h-3 bg-stone-300/40 rounded-full" />
          </div>
        </div>

        {/* Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-[#1A1817]/10 backdrop-blur-md backdrop-saturate-150"
        />

        {/* Centered Locked Out Card */}
        <div className="relative z-20 w-full max-w-md mx-auto">
          <div className="bg-[#FFF2DB] rounded-2xl shadow-[0_20px_45px_-10px_rgba(26,24,23,0.12),0_10px_20px_-8px_rgba(26,24,23,0.08)] border border-[#FFE5BF]/80 p-7 sm:p-9 md:p-10 text-center transform transition-all animate-modal-pop-in">
            {/* Lock Badge Icon Header */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFE5BF] text-stone-600 mb-4 shadow-inner">
              <span className="material-symbols-outlined text-2xl text-stone-700">lock</span>
            </div>

            {/* Event Title & Info */}
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1A1817] tracking-tight">
              {eventTitle}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1 mb-6">
              {photosCount} photos are waiting for you
            </p>

            {/* Rate-Limited Warning Banner */}
            <div className="bg-red-50/95 border border-red-200/90 rounded-xl p-3.5 sm:p-4 mb-6 text-left shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <span className="material-symbols-outlined text-lg text-[#DC2626]">schedule</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-xs sm:text-sm text-red-700 leading-snug">
                    Too many incorrect attempts.
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {secondsRemaining > 0 ? (
                      <>
                        Try again in{' '}
                        <span className="font-bold font-mono text-red-700 tracking-wide">
                          {formattedTime}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-[#059669]">
                        Lockout expired. You can now try again.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Cooldown Progress Bar */}
              <div className="w-full bg-red-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-[#DC2626] h-1.5 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            {secondsRemaining === 0 ? (
              <button
                type="button"
                onClick={() => navigate(`/gallery/${slug}`)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#BB0028] hover:bg-[#F62440] text-white font-heading font-semibold text-sm sm:text-base transition-colors shadow-md cursor-pointer"
              >
                Try Entering PIN Again
              </button>
            ) : (
              <button
                disabled
                type="button"
                className="w-full py-3.5 px-6 rounded-xl bg-stone-300/90 text-stone-500 font-heading font-semibold text-sm sm:text-base cursor-not-allowed transition-colors shadow-none select-none"
              >
                Locked (Wait for timer)
              </button>
            )}

            {/* Help / Inquiries Hint */}
            <p className="font-body text-xs text-stone-500 text-center mt-5">
              Don't have a PIN? <span className="text-stone-700 font-medium">Ask your photographer.</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#FFFAF3] border-t border-[#FFE5BF]/40 py-4 px-6 flex items-center justify-center text-center mt-auto z-10">
        <p className="text-xs text-stone-500 tracking-wide">
          Powered by Momently © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
