import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoSrc from '../../assets/images/momently-logo.png'

/**
 * Navbar — Momently Design System
 * Frosted glass header matching Stitch screenshots exactly
 * Two modes: public (landing) and authenticated (dashboard/workspace)
 */
export default function Navbar({ variant = 'public', user = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Determine if we're on the landing page
  const isLanding = variant === 'public'
  const isAuthenticated = variant === 'authenticated'

  return (
    <header className="fixed top-0 w-full z-50 bg-[rgba(255,250,243,0.85)] backdrop-blur-xl shadow-header">
      <div className="h-[72px] w-full px-4 md:px-10 lg:px-10 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="inline-block transition-transform duration-300 hover:scale-105 hover:drop-shadow-[0_6px_14px_rgba(187,0,40,0.25)]"
          >
            <img
              src={logoSrc}
              alt="Momently"
              className="h-7 md:h-8 w-auto object-contain block"
            />
          </Link>

          {/* Public Nav Links */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-3 py-2 text-[0.875rem] font-[family-name:var(--font-body)] font-medium text-muted hover:text-heading rounded-lg hover:bg-secondary/40 transition-all">
                Features
              </a>
              <a href="#workflow" className="px-3 py-2 text-[0.875rem] font-[family-name:var(--font-body)] font-medium text-muted hover:text-heading rounded-lg hover:bg-secondary/40 transition-all">
                Workflow
              </a>
            </nav>
          )}

          {/* Authenticated Nav Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-4 py-2 text-[0.875rem] font-[family-name:var(--font-body)] font-semibold rounded-full transition-all ${
                  location.pathname === '/dashboard'
                    ? 'bg-secondary text-heading'
                    : 'text-muted hover:text-heading hover:bg-secondary/40'
                }`}
              >
                Events
              </Link>
              <span className="px-3 py-2 text-[0.875rem] font-[family-name:var(--font-body)] font-medium text-muted hover:text-heading rounded-lg hover:bg-secondary/40 transition-all cursor-pointer">
                Galleries
              </span>
            </nav>
          )}
        </div>

        {/* Right: Auth Actions or User Menu */}
        <div className="flex items-center gap-3">
          {isLanding && (
            <>
              <Link
                to="/login"
                className="hidden md:inline-flex px-4 py-2 text-[0.875rem] font-[family-name:var(--font-body)] font-medium text-muted hover:text-heading transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full text-[0.875rem] font-[family-name:var(--font-heading)] font-semibold hover:bg-primary-hover hover:shadow-[0_4px_14px_rgba(246,36,64,0.25)] transition-all active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              {/* User avatar + name */}
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-[0.8125rem] font-[family-name:var(--font-heading)] font-bold">
                  {user.initials}
                </div>
                <span className="hidden md:inline text-[0.875rem] font-[family-name:var(--font-body)] font-medium text-heading">
                  {user.name}
                </span>
                <span className="material-symbols-outlined text-[18px] text-muted group-hover:text-heading transition-colors">
                  expand_more
                </span>
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          {isLanding && (
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[22px] text-heading">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isLanding && mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(255,250,243,0.95)] backdrop-blur-xl border-t border-border/40 animate-fade-in">
          <nav className="flex flex-col px-4 py-4 gap-1">
            <a href="#features" className="px-4 py-3 text-[0.9375rem] font-[family-name:var(--font-body)] font-medium text-heading rounded-xl hover:bg-secondary/40 transition-all">
              Features
            </a>
            <a href="#workflow" className="px-4 py-3 text-[0.9375rem] font-[family-name:var(--font-body)] font-medium text-heading rounded-xl hover:bg-secondary/40 transition-all">
              Workflow
            </a>
            <div className="border-t border-border/30 my-2" />
            <Link to="/login" className="px-4 py-3 text-[0.9375rem] font-[family-name:var(--font-body)] font-medium text-heading rounded-xl hover:bg-secondary/40 transition-all">
              Log In
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
