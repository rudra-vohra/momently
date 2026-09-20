import logoSrc from '../../assets/images/momently-logo.png'
import { Link } from 'react-router-dom'

/**
 * AuthLayout — Shared layout for Login and Register pages
 * Header with logo, centered card, footer with copyright
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF3]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FFFAF3]/90 backdrop-blur-xl border-b border-[#F6D2B2]/40 shadow-[0_1px_8px_rgba(80,50,20,0.04)]">
        <div className="h-[72px] w-full px-4 md:px-10 flex items-center">
          <Link
            to="/"
            className="inline-block transition-transform duration-300 hover:scale-105 hover:drop-shadow-[0_6px_14px_rgba(187,0,40,0.25)]"
          >
            <img src={logoSrc} alt="Momently" className="h-7 md:h-8 w-auto object-contain block" />
          </Link>
        </div>
      </header>

      {/* Main content - centered card */}
      <main className="flex-1 flex flex-col justify-center items-center pt-[72px] px-4 md:px-10 pb-10">
        <div className="w-full max-w-[490px] mx-auto py-6 sm:py-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#FFFAF3]/90 backdrop-blur-xl border-t border-[#F6D2B2]/40 py-4 text-center">
        <span className="text-[0.75rem] font-[family-name:var(--font-body)] font-semibold tracking-[0.02em] text-[#66605B]">
          © 2026 Momently. All rights reserved.
        </span>
      </footer>
    </div>
  )
}
