import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { galleriesService } from '../services/api'
import logoSrc from '../assets/images/momently-logo.png'
import { DEMO_GALLERY_DATA } from '../config/demoGallery'

export default function GalleryViewPage({ isDemo = false }) {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isDemoMode =
    isDemo ||
    slug === 'demo' ||
    slug === 'jennifer-wedding' ||
    location.pathname === '/demo/view' ||
    location.pathname === '/gallery/demo/view'

  // Retrieve authorized gallery data
  const [galleryData, setGalleryData] = useState(() => {
    if (location.state?.galleryData) {
      return isDemoMode ? DEMO_GALLERY_DATA : location.state.galleryData
    }
    const storageKey = isDemoMode ? 'gallery_access_demo' : `gallery_access_${slug}`
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      if (isDemoMode) {
        return DEMO_GALLERY_DATA
      }
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })

  // If no access data found in state or session, redirect to PIN entry
  useEffect(() => {
    if (!galleryData) {
      if (isDemoMode) {
        navigate(location.pathname.startsWith('/demo') ? '/demo' : `/gallery/${slug || 'demo'}`, {
          replace: true,
        })
      } else if (slug) {
        navigate(`/gallery/${slug}`, { replace: true })
      }
    }
  }, [galleryData, isDemoMode, slug, navigate, location.pathname])

  const photos = galleryData?.photos || []
  const eventTitle = galleryData?.event_name || 'Client Gallery'

  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadToast, setDownloadToast] = useState('')

  const isLightboxOpen = lightboxIndex !== null
  const currentPhoto = isLightboxOpen ? photos[lightboxIndex] : null

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % photos.length))
  }, [photos.length])

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? 0 : (prev - 1 + photos.length) % photos.length
    )
  }, [photos.length])

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null)
    setIsPlayingSlideshow(false)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseLightbox()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlayingSlideshow((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, handleCloseLightbox, handleNext, handlePrev])

  // Automatic slideshow timer
  useEffect(() => {
    if (!isPlayingSlideshow || !isLightboxOpen) return

    const timer = setInterval(() => {
      handleNext()
    }, 3500)

    return () => clearInterval(timer)
  }, [isPlayingSlideshow, isLightboxOpen, handleNext])

  const handleStartSlideshow = () => {
    if (photos.length === 0) return
    setLightboxIndex(0)
    setIsPlayingSlideshow(true)
  }

  const handleDownloadSingle = (photo) => {
    const url = photo.download_url || photo.url
    const link = document.createElement('a')
    link.href = url
    link.download = photo.filename || 'photo.jpg'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return
    setIsDownloadingAll(true)
    setDownloadToast('Preparing high-resolution zip archive...')

    if (isDemoMode) {
      setTimeout(() => {
        setDownloadToast('Starting demo download...')
        const link = document.createElement('a')
        link.href = photos[0]?.url || ''
        link.download = `jennifer-wedding-demo.jpg`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => {
          setIsDownloadingAll(false)
          setDownloadToast('')
        }, 2000)
      }, 1000)
      return
    }

    if (!galleryData?.access_token) {
      setIsDownloadingAll(false)
      return
    }

    try {
      const res = await galleriesService.downloadAllArchive(slug, galleryData.access_token)
      if (res?.download_url) {
        setDownloadToast('Starting download...')
        const link = document.createElement('a')
        link.href = res.download_url
        link.download = `${slug}-gallery.zip`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setDownloadToast('Archive ready!')
      }
    } catch (err) {
      console.error('Download all failed:', err)
      setDownloadToast(err.message || 'Failed to download archive.')
    } finally {
      setTimeout(() => {
        setIsDownloadingAll(false)
        setDownloadToast('')
      }, 4000)
    }
  }

  if (!galleryData) return null

  return (
    <div className="bg-[#FFFAF3] min-h-screen text-[#1A1817] antialiased flex flex-col selection:bg-[#FFE5BF] selection:text-[#BB0028]">
      {/* 1. Navigation */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFAF3]/95 backdrop-blur-md border-b border-[#EFE8DE] px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link to="/" aria-label="Momently Home" className="group inline-flex items-center transition-transform hover:scale-105 duration-200">
            <img
              src={logoSrc}
              alt="Momently Logo"
              className="h-7 sm:h-8 w-auto object-contain select-none"
            />
          </Link>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {/* Toast alert */}
        {downloadToast && (
          <div className="p-3 bg-[#FFE5BF] border border-[#f2d09c] text-[#784A1A] rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">cloud_download</span>
              <span>{downloadToast}</span>
            </div>
            {isDownloadingAll && (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            )}
          </div>
        )}

        {/* Gallery Header Bar Card */}
        <section className="bg-[#FFF2DB] border border-[#FFE5BF] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-heading font-bold tracking-tight text-[#1A1817]">
              {eventTitle}
            </h1>
            <div className="flex items-center gap-1 bg-[#FFE5BF] text-[#1A1817] px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-semibold tracking-wide border border-[#F0E1CD]">
              <span className="material-symbols-outlined text-[14px] text-[#F62440]">
                photo_library
              </span>
              <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Download All */}
            <button
              type="button"
              disabled={isDownloadingAll || photos.length === 0}
              onClick={handleDownloadAll}
              className="inline-flex items-center justify-center gap-1.5 border border-primary text-primary hover:bg-primary hover:text-white font-medium text-xs sm:text-[13px] px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isDownloadingAll ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">download</span>
              )}
              <span>{isDownloadingAll ? 'Zipping...' : 'Download All'}</span>
            </button>

            {/* Slideshow */}
            {photos.length > 0 && (
              <button
                type="button"
                onClick={handleStartSlideshow}
                className="inline-flex items-center justify-center gap-1.5 border border-stone-300 text-[#1A1817] bg-white/80 hover:bg-[#FFE5BF] hover:border-[#FFE5BF] font-medium text-xs sm:text-[13px] px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-[#F62440] filled">
                  play_arrow
                </span>
                <span>Slideshow</span>
              </button>
            )}
          </div>
        </section>

        {/* Photo Grid Section */}
        <section aria-label={`${eventTitle} Photo Gallery`} className="w-full">
          {photos.length === 0 ? (
            <div className="py-16 text-center text-stone-500 bg-[#FFF2DB]/40 rounded-2xl border border-dashed border-[#FFE5BF]">
              <span className="material-symbols-outlined text-4xl mb-2 text-stone-400">photo_library</span>
              <p className="text-sm font-semibold text-[#1A1817]">No photos in this published gallery</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {photos.map((photo, index) => {
                const isViewing = isLightboxOpen && lightboxIndex === index
                return (
                  <figure
                    key={photo.id || index}
                    onClick={() => setLightboxIndex(index)}
                    className={`group relative aspect-square rounded-xl overflow-hidden bg-stone-200 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer ${
                      isViewing ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.filename || `Photo ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />

                    {/* Hover dark overlay */}
                    <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Viewing Badge */}
                    {isViewing && (
                      <div className="absolute inset-0 bg-black/20 opacity-100 transition-opacity duration-200 flex items-start p-2">
                        <span className="bg-primary text-white text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold tracking-wide">
                          Viewing
                        </span>
                      </div>
                    )}

                    {/* Hover Download button */}
                    <button
                      type="button"
                      aria-label={`Download ${photo.filename}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadSingle(photo)
                      }}
                      className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 w-9 h-9 rounded-full bg-[#FFE5BF] text-[#1A1817] hover:bg-primary hover:text-white shadow-md flex items-center justify-center transition-all duration-200 focus:opacity-100 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </figure>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* 3. Lightbox Modal */}
      {isLightboxOpen && currentPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between animate-fadeIn select-none"
        >
          {/* Top Bar */}
          <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-white/90 z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white/70">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs sm:text-sm font-medium truncate max-w-[200px] sm:max-w-md">
                {currentPhoto.filename}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Slideshow play/pause */}
              <button
                type="button"
                onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isPlayingSlideshow ? 'Pause slideshow' : 'Play slideshow'}
              >
                <span className="material-symbols-outlined text-xl">
                  {isPlayingSlideshow ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Single Photo Download */}
              <button
                type="button"
                onClick={() => handleDownloadSingle(currentPhoto)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Download photo"
              >
                <span className="material-symbols-outlined text-xl">download</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close lightbox (Esc)"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Photo Display & Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center px-4 sm:px-12 min-h-0">
            {/* Prev button */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none"
              title="Previous photo (←)"
            >
              <span className="material-symbols-outlined text-2xl sm:text-3xl">chevron_left</span>
            </button>

            {/* Current Image */}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.filename}
              className="max-h-[82vh] max-w-full object-contain shadow-2xl transition-all duration-200"
            />

            {/* Next button */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none"
              title="Next photo (→)"
            >
              <span className="material-symbols-outlined text-2xl sm:text-3xl">chevron_right</span>
            </button>
          </div>

          {/* Bottom Caption Bar */}
          <div className="w-full py-3 px-6 text-center text-xs text-white/60 bg-gradient-to-t from-black/60 to-transparent">
            <span>Use arrow keys to navigate · Space to toggle slideshow · Esc to exit</span>
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <footer className="w-full bg-[#FFFAF3] border-t border-[#FFE5BF]/40 py-4 px-6 flex items-center justify-center text-center mt-auto z-10">
        <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500 font-medium tracking-wide">
          <span className="leading-none">Powered by</span>
          <span className="inline-flex items-center group" title="Momently">
            <img
              src={logoSrc}
              alt="Momently"
              className="h-3.5 w-auto block opacity-85 group-hover:opacity-100 transition-opacity translate-y-[0.5px]"
            />
          </span>
        </div>
      </footer>
    </div>
  )
}
