import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { galleriesService } from '../services/api'
import logoSrc from '../assets/images/momently-logo.png'
import { DEMO_PIN, DEMO_GALLERY_DATA, DEMO_PHOTOS } from '../config/demoGallery'

export default function GalleryPinPage({ isDemo = false }) {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isDemoMode =
    isDemo ||
    slug === 'demo' ||
    slug === 'jennifer-wedding' ||
    location.pathname === '/demo' ||
    location.pathname === '/gallery/demo'

  const [galleryInfo, setGalleryInfo] = useState(() => {
    if (isDemoMode) {
      return {
        slug: 'demo',
        event_name: 'Jennifer Wedding',
        photo_count: DEMO_PHOTOS.length,
      }
    }
    return null
  })
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Fetch basic public gallery metadata before PIN entry (skipped for demo mode)
  useEffect(() => {
    if (isDemoMode) {
      setGalleryInfo({
        slug: 'demo',
        event_name: 'Jennifer Wedding',
        photo_count: DEMO_PHOTOS.length,
      })
      setIsLoading(false)
      return
    }

    async function fetchInfo() {
      if (!slug) return
      setIsLoading(true)
      try {
        const info = await galleriesService.getPublicGalleryInfo(slug)
        setGalleryInfo(info)
      } catch (err) {
        console.error('Gallery not found or unpublished:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInfo()
  }, [slug, isDemoMode])

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  const handleDigitChange = (index, value) => {
    setError('')
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

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    const newDigits = [...pinDigits]
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setPinDigits(newDigits)
    const focusIdx = Math.min(pasted.length, 3)
    inputRefs[focusIdx].current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const pin = pinDigits.join('')
    if (pin.length < 4) {
      setError('Please enter all 4 digits.')
      return
    }

    setIsVerifying(true)
    setError('')

    // Frontend-only demo validation completely independent of backend
    if (isDemoMode) {
      setTimeout(() => {
        setIsVerifying(false)
        if (pin === DEMO_PIN) {
          sessionStorage.setItem('gallery_access_demo', JSON.stringify(DEMO_GALLERY_DATA))
          const targetPath = location.pathname.startsWith('/demo')
            ? '/demo/view'
            : `/gallery/${slug || 'demo'}/view`
          navigate(targetPath, { state: { galleryData: DEMO_GALLERY_DATA } })
        } else {
          setError('Incorrect PIN. Please try again.')
          setPinDigits(['', '', '', ''])
          inputRefs[0].current?.focus()
        }
      }, 350)
      return
    }

    try {
      const data = await galleriesService.accessPublicGallery(slug, pin)
      // Save authenticated gallery data in sessionStorage
      sessionStorage.setItem(`gallery_access_${slug}`, JSON.stringify(data))
      navigate(`/gallery/${slug}/view`, { state: { galleryData: data } })
    } catch (err) {
      if (err.status === 429) {
        // Backend rate limit reached (8 attempts / 5 mins)
        navigate(`/gallery/${slug}/locked`)
      } else {
        setError(err.message || 'Incorrect PIN. Please try again.')
        setPinDigits(['', '', '', ''])
        inputRefs[0].current?.focus()
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const eventTitle = galleryInfo?.event_name || 'Protected Gallery'
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
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDemoMode ? 'bg-[#D97706]' : 'bg-[#BB0028]'
              } animate-pulse`}
            />
            <span>{isDemoMode ? 'Demo Gallery' : 'Protected Gallery'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Frosted Backdrop: simulated photo grid suggesting photos waiting behind frosted scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 p-4 sm:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 opacity-40 scale-105 filter blur-md pointer-events-none select-none"
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
          <div className="bg-gradient-to-tr from-[#feddbb] to-[#ffeada] rounded-2xl aspect-[4/5] shadow-sm flex flex-col justify-end p-4">
            <div className="w-4/5 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#fae1cd] to-[#fbd3b6] rounded-2xl aspect-[4/5] shadow-sm flex flex-col justify-end p-4">
            <div className="w-1/2 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#fedbb9] to-[#ffe5cf] rounded-2xl aspect-[4/5] shadow-sm hidden sm:flex flex-col justify-end p-4">
            <div className="w-3/5 h-3 bg-stone-300/40 rounded-full" />
          </div>
          <div className="bg-gradient-to-tr from-[#f6ceba] to-[#f8ded1] rounded-2xl aspect-[4/5] shadow-sm hidden md:flex flex-col justify-end p-4">
            <div className="w-2/3 h-3 bg-stone-300/40 rounded-full" />
          </div>
        </div>

        {/* Frosted overlay scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-[#1A1817]/10 backdrop-blur-md backdrop-saturate-150"
        />

        {/* PIN Entry Card */}
        <div className="relative z-20 w-full max-w-md mx-auto">
          <div className="bg-[#FFF2DB] rounded-2xl shadow-[0_20px_45px_-10px_rgba(26,24,23,0.12),0_10px_20px_-8px_rgba(26,24,23,0.08)] border border-[#FFE5BF]/80 p-6 sm:p-8 transform transition-all animate-modal-pop-in">
            {/* Header: Lock badge icon & event title */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FFE5BF] text-[#BB0028] mb-2.5 shadow-xs">
                <span className="material-symbols-outlined text-lg">lock</span>
              </div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-[#1A1817]">
                {eventTitle}
              </h1>
              <p className="text-stone-600 mt-1 mb-5 text-xs sm:text-sm font-normal">
                {photosCount} {photosCount === 1 ? 'photo is' : 'photos are'} waiting for you
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <label
                id="pin-label"
                className="block text-center text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3.5"
              >
                Enter your 4-digit PIN
              </label>

              {/* 4 PIN Squares Container */}
              <div
                role="group"
                aria-labelledby="pin-label"
                className="flex justify-center items-center gap-3 sm:gap-4 mb-5"
              >
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    placeholder="•"
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    aria-label={`PIN Digit ${index + 1}`}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-bold font-mono text-[#1A1817] placeholder:text-stone-400/80 bg-[#FFE5BF] rounded-xl border-2 border-transparent focus:border-[#F62440] focus:ring-2 focus:ring-[#F62440]/30 focus:outline-none shadow-inner transition-colors duration-150"
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-center text-xs text-[#BB0028] font-medium mb-4 animate-fade-in">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[#BB0028] hover:bg-[#F62440] active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-base cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#F62440]/30 disabled:opacity-75"
              >
                {isVerifying ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>View Gallery</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Helper text */}
              <div className="mt-5 text-center space-y-1">
                <p className="text-xs text-stone-500 font-normal">
                  {isDemoMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPinDigits(DEMO_PIN.split(''))
                        setError('')
                      }}
                      className="font-medium text-[#BB0028] hover:text-[#F62440] underline underline-offset-2 transition-colors cursor-pointer"
                      title="Click to fill demo PIN"
                    >
                      Use demo PIN {DEMO_PIN}
                    </button>
                  ) : (
                    <>
                      Don't have a PIN?{' '}
                      <span className="font-medium text-[#BB0028] hover:text-[#F62440] underline underline-offset-2 transition-colors cursor-pointer">
                        Ask your photographer
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center border-t border-[#FFE5BF]/40 bg-[#FFFAF3]">
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
