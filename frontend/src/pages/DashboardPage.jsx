import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventsService } from '../services/api'
import logoSrc from '../assets/images/momently-logo.png'
import EventCard from '../components/dashboard/EventCard'
import NewEventCard from '../components/dashboard/NewEventCard'
import CreateEventModal from '../components/modals/CreateEventModal'

/**
 * DashboardPage — Matches Stitch "Dashboard (Admin View)" and "Team Member View"
 * Fully integrated with the live backend events API and user auth.
 */
export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, isAdmin: authIsAdmin, logout, isLoading: authLoading } = useAuth()

  const isAdmin = authIsAdmin ?? (user?.role === 'admin')

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [toastMessage, setToastMessage] = useState(() => {
    const fromLocation = location.state?.deletedMessage
    const fromSession = sessionStorage.getItem('momently_deleted_message')
    if (fromLocation || fromSession) {
      sessionStorage.removeItem('momently_deleted_message')
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title)
      }
      return fromLocation || fromSession
    }
    return ''
  })

  const [isToastFading, setIsToastFading] = useState(false)
  const toastFadeTimerRef = useRef(null)
  const toastDismissTimerRef = useRef(null)

  const clearToastTimers = () => {
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    if (toastDismissTimerRef.current) clearTimeout(toastDismissTimerRef.current)
  }

  // Auto-dismiss toast smoothly in 2-3 seconds
  useEffect(() => {
    if (toastMessage) {
      setIsToastFading(false)
      clearToastTimers()

      // Start fade-out at 2.2s
      toastFadeTimerRef.current = setTimeout(() => {
        setIsToastFading(true)
      }, 2200)

      // Fully clear toast after 500ms smooth transition finishes (total 2.7s)
      toastDismissTimerRef.current = setTimeout(() => {
        setToastMessage('')
        setIsToastFading(false)
        sessionStorage.removeItem('momently_deleted_message')
      }, 2750)

      return () => clearToastTimers()
    }
  }, [toastMessage])

  const handleDismissToast = () => {
    if (isToastFading) return
    clearToastTimers()
    setIsToastFading(true)
    toastDismissTimerRef.current = setTimeout(() => {
      setToastMessage('')
      setIsToastFading(false)
      sessionStorage.removeItem('momently_deleted_message')
    }, 400)
  }

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const isLoggingOutRef = useRef(false)

  // Redirect to /login if token is missing and auth check completed
  useEffect(() => {
    if (!authLoading && !token && !isLoggingOutRef.current) {
      navigate('/login')
    }
  }, [authLoading, token, navigate])

  // Fetch events from backend API
  const loadEvents = async () => {
    if (!token) return
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await eventsService.getEvents()
      const formatted = (data || []).map((ev) => ({
        id: ev.id,
        name: ev.name,
        description: ev.description,
        coverImage: ev.cover_image_url || null,
        fallbackImage: null,
        totalPhotos: ev.photo_count ?? 0,
        selectedPhotos: ev.selected_photo_count ?? 0,
        publishedPhotos: ev.published_photo_count ?? 0,
        status: ev.gallery_status === 'published' ? 'published' : 'draft',
        hasUnpublishedChanges: ev.has_unpublished_changes ?? false,
        timestamp: ev.created_at
          ? new Date(ev.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recently',
        actionLabel: ev.gallery_status === 'published' ? 'View Gallery' : 'Curate',
      }))
      setEvents(formatted)
    } catch (err) {
      console.error('Error fetching events:', err)
      setFetchError(err.message || 'Failed to load events.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadEvents()
    }
  }, [token])

  // Handle outside clicks to close profile menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleCreateEvent = async ({ name, description }) => {
    await eventsService.createEvent({ name, description })
    await loadEvents()
  }

  const handleLogout = () => {
    isLoggingOutRef.current = true
    logout()
    navigate('/', { replace: true })
  }

  const displayName = user?.name || 'Studio User'
  const displayEmail = user?.email || 'user@momently.com'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'MO'

  return (
    <div className="bg-[#FFFAF3] font-body text-[#1A1817] min-h-screen flex flex-col relative">
      {/* Floating Success Toast Overlay (Centered, zero layout displacement) */}
      {toastMessage && (
        <div
          className={`fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-all duration-500 ease-out ${
            isToastFading
              ? 'opacity-0 -translate-y-3 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="pointer-events-auto inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#DEF7EC] border border-[#B9ECCE] text-[#03543F] shadow-[0_4px_18px_rgba(0,0,0,0.08)] text-xs sm:text-[13px] font-medium max-w-[calc(100vw-2rem)] animate-fadeIn">
            <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-3 h-3 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="truncate max-w-[260px] sm:max-w-md md:max-w-lg">{toastMessage}</span>
            <button
              type="button"
              onClick={handleDismissToast}
              className="ml-1 p-0.5 text-[#03543F]/70 hover:text-[#03543F] rounded-md transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-base leading-none">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-[#FFFAF3]/95 backdrop-blur-md border-b border-[#FFE5BF]/60 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-15 flex items-center justify-between">
          {/* Left: Momently Brand Logo with Pop Hover Effect */}
          <Link
            to="/dashboard"
            className="flex items-center py-1.5 px-1 focus:outline-none"
            title="Momently Home"
          >
            <img
              src={logoSrc}
              alt="Momently"
              className="h-7 sm:h-7.5 w-auto object-contain transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:drop-shadow-[0_8px_16px_rgba(246,36,64,0.35)] active:scale-95 will-change-transform"
            />
          </Link>

          {/* Right: User Avatar & Profile Dropdown Indicator */}
          <div className="flex items-center gap-3 relative" ref={profileMenuRef}>
            {/* Profile trigger button */}
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="group flex items-center gap-2 sm:gap-2.5 py-1 px-2.5 rounded-full hover:bg-[#FFE5BF]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F62440]/30 cursor-pointer"
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
            >
              <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#bb0028] text-white flex items-center justify-center font-heading font-bold text-xs shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-[#F62440]">
                {initials}
              </div>
              <span className="hidden md:block font-heading font-semibold text-xs text-[#1A1817] group-hover:text-[#F62440] transition-colors">
                {displayName}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-[#68625D] group-hover:text-[#1A1817] transition-transform duration-200 ${
                  profileMenuOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-[#FFF2DB] border border-[#F6D2B2]/60 shadow-[0_8px_20px_rgba(60,30,10,0.12)] py-1.5 z-50 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-[#F6D2B2]/40">
                  <p className="font-heading font-bold text-xs text-[#1A1817] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#68625D] truncate">{displayEmail}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-[#FFE5BF] text-[#784A1A]">
                    {isAdmin ? 'Studio Admin' : 'Photographer'}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-[#bb0028] hover:bg-[#FFE5BF]/80 rounded-lg transition-colors font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-7 animate-dashboard-slide-in">

        {/* Error Banner if events fetch failed */}
        {fetchError && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 text-[#ba1a1a] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={loadEvents}
              className="px-3 py-1 bg-[#ba1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#93000a] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#1A1817] tracking-tight">
              Your Events
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#68625D] font-normal">
              Manage and curate your event galleries
            </p>
          </div>

          {/* Quick Action / Total Stats */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#68625D] bg-[#FFF2DB] border border-[#FFE5BF]">
              {events.length} {isAdmin ? 'Active' : 'Assigned'} {events.length === 1 ? 'Gallery' : 'Galleries'}
            </span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#FFF2DB]/60 rounded-2xl p-4 border border-[#FFE5BF]/60 flex flex-col gap-3 animate-pulse"
              >
                <div className="w-full aspect-[16/10] bg-[#FFE5BF]/70 rounded-xl" />
                <div className="h-5 bg-[#FFE5BF]/80 rounded w-2/3" />
                <div className="h-3 bg-[#FFE5BF]/60 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          /* Event Grid (Responsive 3 cols Desktop, 2 cols Tablet, 1 col Mobile) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* CARD 0: "Create New Event" Card (Admin Exclusive) */}
            {isAdmin && (
              <NewEventCard onClick={() => setIsCreateModalOpen(true)} />
            )}

            {/* Empty State */}
            {events.length === 0 ? (
              <div className={`${isAdmin ? 'sm:col-span-1 lg:col-span-2' : 'col-span-full'} py-12 px-6 rounded-2xl bg-[#FFF2DB]/50 border border-dashed border-[#FFE5BF] flex flex-col items-center justify-center text-center`}>
                <div className="w-12 h-12 rounded-full bg-[#FFE5BF] flex items-center justify-center text-[#784A1A] mb-3 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">photo_library</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1A1817] mb-1">
                  {isAdmin ? 'No events created yet' : 'No assigned events'}
                </h3>
                <p className="font-body text-xs text-[#68625D] max-w-sm">
                  {isAdmin
                    ? 'Get started by creating your first event workspace to upload, curate, and publish galleries.'
                    : 'You do not have any events assigned to your account yet. When an admin adds you to an event, it will appear here.'}
                </p>
              </div>
            ) : (
              /* Event Cards */
              events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-[#FFE5BF]/60 bg-[#FFFAF3] py-3.5 sm:py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#68625D]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            <span>All systems operational · Encrypted Studio Storage</span>
          </div>
          <p>© 2026 Momently. All rights reserved.</p>
        </div>
      </footer>

      {/* Create New Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  )
}
