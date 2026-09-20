import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoSrc from '../assets/images/momently-logo.png'
import useModalAnimation from '../hooks/useModalAnimation'
import { DEMO_PIN } from '../config/demoGallery'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const { isMounted, isExiting, triggerClose } = useModalAnimation(
    isDemoModalOpen,
    () => setIsDemoModalOpen(false),
    200
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting) {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, isExiting, triggerClose])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (e, id) => {
    if (e) e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUnlockDemo = () => {
    setIsUnlocking(true)
    setTimeout(() => {
      triggerClose()
      setIsUnlocking(false)
      navigate('/demo')
    }, 450)
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased overflow-x-hidden w-full flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_2px_12px_-2px_rgba(80,50,20,0.05)] border-b border-secondary-fixed/15">
        <div className="h-12 sm:h-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              to="/"
              onClick={scrollToTop}
              className="flex items-center gap-2 group flex-shrink-0 cursor-pointer"
            >
              <img
                src={logoSrc}
                alt="Momently"
                className="h-5 sm:h-6 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-5 sm:gap-6">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="text-xs sm:text-[13px] font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="text-xs sm:text-[13px] font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Workflow
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              to="/login"
              className="text-xs sm:text-[13px] font-medium text-on-surface-variant hover:text-on-surface px-2.5 py-1 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-primary text-on-primary text-xs sm:text-[13px] px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full shadow-xs hover:bg-primary-container hover:text-on-primary-container transition-all text-center whitespace-nowrap font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-12 sm:pt-14 bg-surface min-h-screen overflow-x-hidden flex-1">
        <div className="flex flex-col w-full">
          {/* Top Ambient Glow */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-secondary-container/40 via-secondary-container/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* 1. HERO SECTION */}
            <section className="relative pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-primary font-medium text-[11px] shadow-xs mb-2.5 max-w-[92vw] sm:max-w-none">
                <span className="text-[11px]">✨</span>
                <span className="font-semibold text-primary truncate">
                  Every moment, curated and shared.
                </span>
              </div>

              {/* Headline Logo Wordmark */}
              <div className="mb-2.5 max-w-2xl mx-auto flex items-center justify-center px-4 w-full">
                <img
                  src={logoSrc}
                  alt="Momently"
                  className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[240px] h-auto object-contain mx-auto block transition-transform"
                />
              </div>

              {/* Subheadline */}
              <p className="text-xs sm:text-[13px] md:text-sm text-secondary max-w-lg mx-auto mb-4 sm:mb-5 leading-relaxed px-4">
                Momently lets your team upload freely, helps you pick the best shots, and puts a private, PIN-protected gallery in your client’s hands — no account required.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md mx-auto mb-6 sm:mb-8 px-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap bg-primary text-on-primary text-xs sm:text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-[0_3px_10px_rgba(246,36,64,0.22)] hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer flex-shrink-0"
                >
                  Get Started
                </Link>
                <button
                  type="button"
                  id="demo-gallery-btn"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap gap-1.5 bg-surface-container-low text-on-surface text-xs sm:text-[13px] font-medium px-4 py-2.5 rounded-full shadow-xs hover:bg-secondary-container transition-all cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                  <span>View Demo Gallery</span>
                </button>
              </div>

              {/* Interactive Collaged Mock Gallery Deck */}
              <div className="relative w-full max-w-full lg:max-w-3xl mx-auto pt-1 pb-3 sm:pb-4 px-2 overflow-hidden">
                <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-2.5 items-center justify-start md:justify-center overflow-x-auto md:overflow-visible pb-2 md:pb-0 px-1 sm:px-0 snap-x snap-mandatory scrollbar-none max-w-full">
                  {/* Card 1: Beach Ceremony */}
                  <div className="flex-shrink-0 w-[140px] sm:w-[155px] md:w-auto snap-center group relative bg-surface-container rounded-lg p-1.5 shadow-[0_6px_16px_-4px_rgba(80,50,20,0.06)] transform md:-rotate-3 hover:rotate-0 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="relative rounded-md overflow-hidden aspect-[4/5] bg-surface-variant">
                      <img
                        className="w-full h-full object-cover"
                        alt="Scenic beachside ceremony setup with floral altar overlooking ocean waters"
                        src="/landing/01-beach-ceremony.jpg"
                      />
                    </div>
                  </div>

                  {/* Card 2: Wedding Rings Detail */}
                  <div className="flex-shrink-0 w-[140px] sm:w-[155px] md:w-auto snap-center group relative bg-surface-container rounded-lg p-1.5 shadow-[0_6px_16px_-4px_rgba(80,50,20,0.06)] transform md:rotate-2 md:-mt-3 hover:rotate-0 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="relative rounded-md overflow-hidden aspect-[4/5] bg-surface-variant">
                      <img
                        className="w-full h-full object-cover"
                        alt="Gold wedding bands nestled on an ivory lace ring cushion"
                        src="/landing/02-wedding-rings.jpg"
                      />
                    </div>
                  </div>

                  {/* Card 3: Centerpiece Card (Hero Focus: Floral Canopy) */}
                  <div className="flex-shrink-0 w-[150px] sm:w-[165px] md:w-auto snap-center group relative bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-[0_12px_24px_-6px_rgba(80,50,20,0.1)] transform md:-translate-y-3 hover:scale-105 transition-all duration-300 z-20">
                    <div className="relative rounded-md overflow-hidden aspect-[4/5] bg-surface-variant">
                      <img
                        className="w-full h-full object-cover"
                        alt="Newlywed couple under an illuminated floral archway glowing with romantic fairy lights"
                        src="/landing/03-floral-canopy.jpg"
                      />
                    </div>
                  </div>

                  {/* Card 4: Intimate Bouquet & Rings Hands */}
                  <div className="flex-shrink-0 w-[140px] sm:w-[155px] md:w-auto snap-center group relative bg-surface-container rounded-lg p-1.5 shadow-[0_6px_16px_-4px_rgba(80,50,20,0.06)] transform md:-rotate-2 md:-mt-2 hover:rotate-0 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="relative rounded-md overflow-hidden aspect-[4/5] bg-surface-variant">
                      <img
                        className="w-full h-full object-cover"
                        alt="Timeless black and white photograph of hands holding the bridal bouquet with wedding rings"
                        src="/landing/04-bouquet-hands.jpg"
                      />
                    </div>
                  </div>

                  {/* Card 5: Romantic Couple Walk */}
                  <div className="flex-shrink-0 w-[140px] sm:w-[155px] md:w-auto snap-center group relative bg-surface-container rounded-lg p-1.5 shadow-[0_6px_16px_-4px_rgba(80,50,20,0.06)] transform md:rotate-3 hover:rotate-0 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="relative rounded-md overflow-hidden aspect-[4/5] bg-surface-variant">
                      <img
                        className="w-full h-full object-cover"
                        alt="Candid couple walking hand in hand along a sunlit leafy path"
                        src="/landing/05-couple-walk.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Live Status Bar */}
                <div className="mt-3 sm:mt-4 mx-auto inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-xs max-w-full">
                  <div className="flex -space-x-1 overflow-hidden flex-shrink-0">
                    <div className="inline-block h-4 w-4 rounded-full ring-1 ring-surface-container-lowest bg-primary-container text-[8px] text-white font-bold flex items-center justify-center">
                      AV
                    </div>
                    <div className="inline-block h-4 w-4 rounded-full ring-1 ring-surface-container-lowest bg-secondary-fixed text-[8px] text-on-secondary-fixed font-bold flex items-center justify-center">
                      JD
                    </div>
                    <div className="inline-block h-4 w-4 rounded-full ring-1 ring-surface-container-lowest bg-tertiary-container text-[8px] text-white font-bold flex items-center justify-center">
                      MK
                    </div>
                  </div>
                  <span className="text-[11px] text-secondary font-medium truncate">
                    3 shooters active • <strong className="text-on-surface font-semibold">1,248 uploaded</strong>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                </div>

                {/* Interactive Scroll to Explore Cue */}
                <div className="mt-4 sm:mt-5 flex flex-col items-center justify-center">
                  <a
                    href="#how-it-works"
                    onClick={(e) => scrollToSection(e, 'how-it-works')}
                    className="group inline-flex flex-col items-center gap-0.5 text-secondary hover:text-primary transition-all duration-300 cursor-pointer"
                    aria-label="Scroll down to explore how it works"
                  >
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-secondary/70 group-hover:text-primary transition-colors">
                      Scroll to explore
                    </span>
                    <span className="material-symbols-outlined text-lg sm:text-xl text-primary animate-bounce">
                      keyboard_arrow_down
                    </span>
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* 2. "HOW IT WORKS" SECTION (Light peach band) */}
          <section className="w-full bg-secondary-container pt-[17px] sm:pt-[21px] pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 scroll-mt-20" id="how-it-works">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center max-w-xl mx-auto mb-6 sm:mb-7">
                <span className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-widest block mb-1">
                  Simple 3-step engine
                </span>
                <h2 className="text-xl sm:text-2xl md:text-[28px] text-on-surface font-bold tracking-tight mb-1.5">
                  How it works
                </h2>
                <p className="text-xs sm:text-sm text-secondary">
                  From shutter click to client delivery in three effortless steps.
                </p>
              </div>

              {/* 3-Column Grid Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch w-full">
                {/* Step Card 1 */}
                <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 md:p-6 shadow-[0_4px_16px_-2px_rgba(80,50,20,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 w-full overflow-hidden">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center mb-4 shadow-[0_3px_10px_rgba(246,36,64,0.25)]">
                      <span className="material-symbols-outlined text-xl">cloud_upload</span>
                    </div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-1">
                      01 / INGESTION
                    </span>
                    <h3 className="text-base sm:text-lg text-on-surface font-bold mb-2">
                      Upload, together
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed mb-4">
                      Every photo, from everyone, in one place. Your lead shooter, candid photographer, and guest drone pilot sync directly to a single timeline.
                    </p>
                  </div>

                  {/* Mini Graphic 1: Multi-shooter upload feed */}
                  <div className="bg-surface-container-low rounded-lg p-2.5 space-y-1.5 w-full overflow-hidden">
                    <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-1.5 rounded-md shadow-xs min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxPE0p6Wd2kJfWvSrhYcrXqYttuMEmTmu8MemCJbOIsinS3fVnQU6po9tRJjL-z_0RfOS-hAzdk_EO5QdFp15mOwWOLMAZsAeJ2QBponfnLRCUM6gIBl-xArNYwF1XspxSMYiP6kOMRv7LbPtXw5JzifVxc4GjRly6JLBg4RQpOnWOGwerAe3p3YdzpGg2hbSU-XncKQ1H7Ck0RmY3PgcfhVZL45_wtkHeIu9Lx1l7hhdLuDWHmkm1"
                          alt="IMG_2145.jpg"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover flex-shrink-0"
                        />
                        <div className="text-left min-w-0 flex-1 truncate">
                          <div className="text-[11px] sm:text-xs font-medium text-on-surface leading-tight truncate">IMG_2145.jpg</div>
                          <div className="text-[10px] text-on-surface-variant truncate">John</div>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-[10px]">check</span> Uploaded
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-1.5 rounded-md shadow-xs min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZAOlvLrkcLP5YgNsQky3mMXXkJwQWSklU6kWQSnuqfJRJXcsnDvXTFanbc6vLdp_TMn3jM5LHMq_9mOXNDTvrxeHHBdtR66q0TfEF4ZyRBNTetNySl8pxcuhgZx4AXoceGUYemU8wSopA3b1GcOdJrCqoTti3pkWjmhD-Hk2umPxiu22sfueTd5zhtaTyU0jQtNYWLItgLCPGtxo4A_ASY6Dp2gLQbukAi_7ps88PvUj88aS-D3QJ"
                          alt="DSC_8902.jpg"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover flex-shrink-0"
                        />
                        <div className="text-left min-w-0 flex-1 truncate">
                          <div className="text-[11px] sm:text-xs font-medium text-on-surface leading-tight truncate">DSC_8902.jpg</div>
                          <div className="text-[10px] text-on-surface-variant truncate">Marcus</div>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-[10px]">check</span> Uploaded
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-1.5 rounded-md shadow-xs min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIAJBDvlpElJw1YWL6HfCPM-qRz7eJ0v9ectbhHJDVBSY8PdOM10o0NUvQPCT42iyT1Cn3ZgNT73GgDAOKQYeLe83xeOPJRTv8CinRVc4dTXSooyi-ziLrqViklgHBh0HvvST6zzAO5TPz7O4O0LQU4Xk6aXHBBd1Bll5b0DX5A1ra8Oxeuh11yT_c_PK9aELmfrRJ8-bMEuwk-bvXScQ53rspY5FRCDvUlbsoKYTH0HWBDdv6FAlJ"
                          alt="IMG_4410.jpg"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover flex-shrink-0"
                        />
                        <div className="text-left min-w-0 flex-1 truncate">
                          <div className="text-[11px] sm:text-xs font-medium text-on-surface leading-tight truncate">IMG_4410.jpg</div>
                          <div className="text-[10px] text-on-surface-variant truncate">Liam</div>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-[10px]">check</span> Uploaded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step Card 2 */}
                <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 md:p-6 shadow-[0_4px_16px_-2px_rgba(80,50,20,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 w-full overflow-hidden">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center mb-4 shadow-[0_3px_10px_rgba(246,36,64,0.25)]">
                      <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    </div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-1">
                      02 / CURATION
                    </span>
                    <h3 className="text-base sm:text-lg text-on-surface font-bold mb-2">
                      Pick the winners
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed mb-4">
                      You decide what makes the cut. Review every upload in one place and select your best shots for the final gallery.
                    </p>
                  </div>

                  {/* Mini Graphic 2: Curation Interface Mock */}
                  <div className="bg-surface-container-low rounded-lg p-2.5 space-y-2 w-full overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] pb-0.5">
                      <span className="font-semibold text-on-surface-variant">
                        12 selected · 142 photos
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      <div className="relative aspect-square rounded-md overflow-hidden ring-1.5 ring-primary">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEOWAH6wDJG9zNAwKWX-CSFx3uWGof6Ls8IoosrCy8W3RvaYUAqi_LkzUp5ZGEvxmfkgTSK3zaVsYPbC-QtBD6p5xucQ8xsOcHCqLuF0K6uaBSkWZ7rMQftoqREL5yXWZk4nBnARR4FPuHAjcAmxzV1DsuwvEwqwF5f62Nw8OzubZ4zdc7Z01r6ie2uky79C1JkkTBDJofkONvON9u0F2RMdvsHfB2DvaF00hyN_x8NqN9R0_o9wLL"
                          alt="Wedding moment"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[10px] text-white">check</span>
                        </div>
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaqnpexm2YeWS-sySByfSXksPDw_1NqdnK0jXaptOIneN-ojml4Vy3PNtPbfVRuQByyL1S5WPQUqIQjFhG4lZQqZPjRfFi645G1cD_c3c_5B9OXWRwkBVhq_rf0HM6zDC2dEI175xGEnFakvwPnRdcBYSAPjg_NmIJdTX7oLwTEyn6mDZjhldsHXNlUuKGa04UsPpgf40ti6u0FPFzaCBGdYiakQHC41Gr5PbyD1E8iuj2coXZWqks"
                          alt="Celebration candid"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden ring-1.5 ring-primary">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuClIDicDOk9MuD0XpXwTZhXGyT2IR2h7vuYzHoERYKcZnD3EZEnhUp3jLc5JhVHiN-MA1n-wojb0lPn-hGWijwWhFRaMWBcPozT8OBB2IHm5OyqmGbrwivun_AyRJW6bB71gCPiB68b6Pb94DBU7zShmstUG9Pvw8iys5w3B6lBJWdmIPMno1oV2fi94hJi_fJfKBhjW-HuyCeUrVmaxoxxMv_yS17bd7qCsLgAo1G7HYfu1MEYcndB"
                          alt="Bouquet candid"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[10px] text-white">check</span>
                        </div>
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC36rq7H-R4SwKJ2KJN6jMxvtIZTTsL3U72jD1j_xbFgiVfmYP4Vbh8BU6Z724ueFt83Lmh911D26i6hchedc4JppZvN--d9_2ZK-E8MT28XllJ4oADpQoj65Mv-KviYdnSKIhBIGpueDO-e_jFHAoXbTw6u3h5tFUHqEfEil60NNaCkyVfEbEvK_1UwMCqveXmJZP1fC_w14O1ZqMxVlyZlPkaNgoJaWZytzvder21aJeU8YN-8dHp"
                          alt="Reception dance"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden ring-1.5 ring-primary">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeyQSz-z4X5XYy1qcpsVfZLT2fw306sxyPsHzedSzspEy0XB3VpeshwIjMsBfBEwPlpZ9ociYqOch2iKfNqJ6I1WtLgyUJA0Wy70gh927V8OVaSdsycMylHqaEPDMzIh3fw6haBIPtbQAOaJgqZARfnzVT8cmv1JQSEAL4ZedxB_2Og-9x2iMXX2zOAiRZe0bFmyoCuZFhVdvVbarECqCYnLqeA5p54wvkxn61Vmfi1bU3KeKFo7Vg"
                          alt="Couple toast"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[10px] text-white">check</span>
                        </div>
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVYjU7NFG-2i2F9rEJi0rXdgdQuVcecVehLU6xlHgF3qXP0T-bq2qSNmRruLH-DH8LEAcRTRfJCpD_fbLkuHx6NLYhDdU_5V-1RNb2VTV10OJVAd-vjWE4PL-R3lSvCapNZDdCKqte2I1TM9bXAu71GCoN1GHtVnvjr-0abbUMNCnWuLorK_NZi9eWupeR1eYY36rngdOwI5rVBN_G4lIzbqjinz49vVDIMU9mDQIyXCDQPXzwRmY-"
                          alt="Party celebration"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Card 3 */}
                <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 md:p-6 shadow-[0_4px_16px_-2px_rgba(80,50,20,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 w-full overflow-hidden">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center mb-4 shadow-[0_3px_10px_rgba(246,36,64,0.25)]">
                      <span className="material-symbols-outlined text-xl">send_to_mobile</span>
                    </div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-1">
                      03 / HANDOFF
                    </span>
                    <h3 className="text-base sm:text-lg text-on-surface font-bold mb-2">
                      Share the good stuff
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed mb-4">
                      One link. One PIN. Zero sign-ups. Your clients tap, unlock with a 4-digit passcode, and can immediately view or download their gallery in crisp resolution.
                    </p>
                  </div>

                  {/* Mini Graphic 3: PIN Modal Mock */}
                  <div className="bg-surface-container-low rounded-lg p-2.5 text-center w-full overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5 bg-surface-container-lowest px-2 py-1.5 rounded-md shadow-xs mb-2 min-w-0">
                      <span className="text-[10px] font-code-sm text-secondary truncate font-medium flex-1 text-left min-w-0">
                        momently.app/gallery/jennifer-wedding
                      </span>
                      <span className="material-symbols-outlined text-xs text-on-surface-variant cursor-pointer hover:text-on-surface flex-shrink-0">
                        content_copy
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-on-surface mb-1.5">Gallery PIN</div>
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-2">
                      <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-surface-container-lowest shadow-xs flex items-center justify-center font-code-sm text-xs sm:text-sm font-bold text-on-surface">
                        4
                      </span>
                      <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-surface-container-lowest shadow-xs flex items-center justify-center font-code-sm text-xs sm:text-sm font-bold text-on-surface">
                        9
                      </span>
                      <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-surface-container-lowest shadow-xs flex items-center justify-center font-code-sm text-xs sm:text-sm font-bold text-on-surface">
                        2
                      </span>
                      <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-surface-container-lowest shadow-xs flex items-center justify-center font-code-sm text-xs sm:text-sm font-bold text-on-surface">
                        0
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Gallery Live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. FEATURES SECTION (Cream surface) */}
          <section className="w-full bg-surface py-10 sm:py-14 px-4 sm:px-6 lg:px-8 scroll-mt-20" id="features">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                <span className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-widest block mb-1">
                  Built for speed &amp; delight
                </span>
                <h2 className="text-xl sm:text-2xl md:text-[28px] text-on-surface font-bold tracking-tight mb-1.5">
                  Everything you need to deliver faster
                </h2>
                <p className="text-xs sm:text-sm text-secondary">
                  Crafted specifically for event photographers, wedding crews, and creative studios.
                </p>
              </div>

              {/* 2x2 Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4.5">
                {/* Feature 1 */}
                <div className="bg-surface-container rounded-xl p-4 sm:p-5 md:p-6 hover:bg-secondary-container/50 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_12px_28px_-6px_rgba(80,50,20,0.1)] transition-all duration-300 ease-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-lg">lock</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                        Draft Mode • Private
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base text-on-surface font-bold mb-1.5">
                      Locked until you say so
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed">
                      Nothing is visible until you publish it. Cull bad shots, reorganize sets, and perfect your gallery without worrying about premature client glances.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-surface-container rounded-xl p-4 sm:p-5 md:p-6 hover:bg-secondary-container/50 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_12px_28px_-6px_rgba(80,50,20,0.1)] transition-all duration-300 ease-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-lg">cloud</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-semibold">
                        Original RAW &amp; High-Res CDN
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base text-on-surface font-bold mb-1.5">
                      Built on solid storage
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed">
                      Fast, reliable, no matter how many photos. Store original full resolution RAWs while instant previews deliver smooth browsing anywhere in the world.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-surface-container rounded-xl p-4 sm:p-5 md:p-6 hover:bg-secondary-container/50 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_12px_28px_-6px_rgba(80,50,20,0.1)] transition-all duration-300 ease-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-lg">groups</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-semibold">
                        Role-based access
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base text-on-surface font-bold mb-1.5">
                      Everyone stays in their lane
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed">
                      Admins curate, team members upload. Total control over who does what resulting in smooth collaboration.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-surface-container rounded-xl p-4 sm:p-5 md:p-6 hover:bg-secondary-container/50 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_12px_28px_-6px_rgba(80,50,20,0.1)] transition-all duration-300 ease-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-semibold">
                        Instant Client Access
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base text-on-surface font-bold mb-1.5">
                      No accounts for clients
                    </h3>
                    <p className="text-xs sm:text-[13px] text-secondary leading-relaxed">
                      Just a link and a PIN. Done. Eliminates annoying registration flows, password resets, and client friction right when they are excited to see their photos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. CALL TO ACTION STRIP */}
          <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 sm:pb-7">
            <div className="relative bg-secondary-container rounded-2xl p-5 sm:p-7 md:p-8 overflow-hidden shadow-[0_8px_30px_-8px_rgba(80,50,20,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              {/* Background Ambient Accent */}
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-md text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-primary text-[10px] font-semibold mb-2.5">
                  <span className="material-symbols-outlined text-xs">flash_on</span>
                  <span>GET SETUP IN UNDER 2 MINUTES</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl text-on-surface font-bold tracking-tight leading-tight mb-2">
                  Ready to deliver your best work?
                </h3>
                <p className="text-xs sm:text-sm text-secondary">
                  Join thousands of independent wedding and event photographers delivering sleek, branded client galleries without the bloat.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto z-10 flex-shrink-0">
                <Link
                  to="/register"
                  className="w-full sm:w-auto text-center whitespace-nowrap bg-primary text-on-primary text-xs sm:text-[13px] font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-[0_3px_12px_rgba(246,36,64,0.25)] hover:bg-primary-container hover:text-on-primary-container transition-all"
                >
                  Start Curating for Free
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Ambient Glow */}
      <div className="relative w-full h-0 overflow-visible pointer-events-none z-0">
        <div className="mx-auto left-1/2 -translate-x-1/2 -top-20 absolute w-[500px] h-[120px] bg-gradient-to-t from-secondary-container/30 via-secondary-container/10 to-transparent blur-3xl rounded-full pointer-events-none" />
      </div>

      <footer className="w-full py-3 sm:py-3.5 bg-surface/90 backdrop-blur-xl shadow-[0_2px_12px_-2px_rgba(80,50,20,0.04)] relative z-10 border-t border-secondary-fixed/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center">
            <img
              src={logoSrc}
              alt="Momently"
              className="h-4.5 sm:h-5 w-auto object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-secondary text-center">
            <span className="material-symbols-outlined text-[11px]">terminal</span>
            <span>Built by Rudra Vohra</span>
            <span className="mx-1 text-outline-variant">•</span>
            <a
              href="https://github.com/rudra-vohra/momently"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-xs">code</span>
              <span>GitHub</span>
            </a>
          </div>
          <div className="text-[10px] sm:text-[11px] text-on-surface-variant text-center">
            © 2026 Momently. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Interactive Modal for "View Demo Gallery" */}
      {isMounted && (
        <div
          id="demo-modal"
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 ${
            isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isExiting) triggerClose()
          }}
        >
          <div
            className={`bg-white max-w-sm sm:max-w-md w-full rounded-2xl p-6 sm:p-7 shadow-2xl relative text-center ${
              isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
            }`}
          >
            <button
              type="button"
              id="close-modal-btn"
              onClick={triggerClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#FFE5BF] text-[#BB0028] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl">photo_library</span>
              </div>
              <h4 className="text-lg sm:text-xl text-[#1A1817] font-bold mb-2 tracking-tight">
                Experience Client Delivery
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed mb-6 max-w-xs mx-auto">
                Enter demo PIN <strong className="text-[#1A1817] font-semibold font-mono">{DEMO_PIN}</strong> to simulate the frictionless client viewing portal.
              </p>
              <div className="flex justify-center mb-6">
                <div className="w-44 py-2.5 rounded-xl bg-[#F5F3EF] text-[#1A1817] font-mono text-xl font-bold tracking-[0.5em] flex items-center justify-center select-all">
                  {DEMO_PIN.split('').join(' ')}
                </div>
              </div>
              <button
                type="button"
                id="unlock-demo-btn"
                onClick={handleUnlockDemo}
                disabled={isUnlocking}
                className="w-full bg-[#BB0028] hover:bg-[#9B0021] text-white text-sm py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {isUnlocking ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>Access Granted!</span>
                  </>
                ) : (
                  'Unlock Simulated Gallery'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          className="fixed bottom-5 right-5 z-40 bg-surface-container-lowest/95 backdrop-blur-md text-on-surface hover:text-primary hover:bg-secondary-container p-2.5 rounded-full shadow-[0_4px_16px_rgba(80,50,20,0.12)] border border-secondary-fixed/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center animate-fade-in"
        >
          <span className="material-symbols-outlined text-lg text-primary">arrow_upward</span>
        </button>
      )}
    </div>
  )
}
