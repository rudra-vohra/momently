import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSrc from '../assets/images/momently-logo.png'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await register({
        name: fullname,
        email,
        password,
        role: isAdmin ? 'admin' : 'team_member',
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="bg-[#FFFAF3] font-body-md text-on-surface h-screen h-[100dvh] max-h-screen flex flex-col justify-between overflow-hidden w-full max-w-full selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Header */}
      <header className="w-full flex-shrink-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-xl border-b border-[#F6D2B2]/40 shadow-[0_1px_8px_rgba(80,50,20,0.04)]">
        <div className="h-12 sm:h-14 w-full px-margin-mobile md:px-space-xl lg:px-margin flex items-center justify-between">
          <Link to="/" className="momently-logo focus:outline-none">
            <img
              src={logoSrc}
              alt="Momently"
              className="h-6 sm:h-7 w-auto object-contain block"
            />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-full flex-1 flex flex-col justify-center items-center px-3 sm:px-4 py-1 sm:py-2 min-h-0 overflow-hidden">
        <div className="flex flex-col w-full max-w-full items-center justify-center relative isolate my-auto">
          {/* Centered Registration Card Container */}
          <div className="w-full max-w-[430px] mx-auto relative z-10 px-1 sm:px-0">
            <div className="relative overflow-hidden bg-[#FFF2DB] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-[0_16px_40px_-12px_rgba(80,50,20,0.08),0_4px_16px_-2px_rgba(80,50,20,0.04)] border border-[#F6D2B2]/60 text-left animate-modal-pop-in">
              <div className="space-y-0.5 mb-2.5 sm:mb-3">
                <h1 className="font-headline-lg text-lg sm:text-xl font-extrabold tracking-tight text-on-surface">
                  Create your account
                </h1>
                <p className="font-body-sm text-[11px] sm:text-xs text-[#666666] leading-snug">
                  Join Momently to curate, collaborate, and deliver client galleries.
                </p>
              </div>

              {error && (
                <div className="mb-2 p-2 rounded-xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 flex items-center justify-center gap-1.5 text-center">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-base leading-none select-none">
                    error
                  </span>
                  <p className="font-body-sm text-[11px] text-[#ba1a1a] leading-tight font-medium">
                    {error}
                  </p>
                </div>
              )}

              <form className="space-y-2 sm:space-y-2.5" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="space-y-0.5 text-left">
                  <label
                    htmlFor="fullname"
                    className="block font-label-md text-[11px] sm:text-xs text-on-surface font-semibold"
                  >
                    Full name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="fullname"
                      name="fullname"
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full bg-[#ffffff] text-on-surface placeholder-[#926e6d]/60 text-xs sm:text-sm font-body-md px-3 py-1.5 sm:py-2 rounded-xl transition-all duration-200 shadow-sm outline-none border-2 border-transparent focus:border-primary focus:ring-3 focus:ring-primary/20"
                    />
                    <span className="material-symbols-outlined absolute right-2.5 text-[#926e6d]/60 pointer-events-none text-[16px]">
                      person
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-0.5 text-left">
                  <label
                    htmlFor="email"
                    className="block font-label-md text-[11px] sm:text-xs text-on-surface font-semibold"
                  >
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@studio.com"
                      className="w-full bg-[#ffffff] text-on-surface placeholder-[#926e6d]/60 text-xs sm:text-sm font-body-md px-3 py-1.5 sm:py-2 rounded-xl transition-all duration-200 shadow-sm outline-none border-2 border-transparent focus:border-primary focus:ring-3 focus:ring-primary/20"
                    />
                    <span className="material-symbols-outlined absolute right-2.5 text-[#926e6d]/60 pointer-events-none text-[16px]">
                      alternate_email
                    </span>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-0.5 text-left">
                  <label
                    htmlFor="password"
                    className="block font-label-md text-[11px] sm:text-xs text-on-surface font-semibold"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#ffffff] text-on-surface placeholder-[#926e6d]/60 text-xs sm:text-sm font-body-md pl-3 pr-9 py-1.5 sm:py-2 rounded-xl transition-all duration-200 shadow-sm outline-none border-2 border-transparent focus:border-primary focus:ring-3 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 text-[#926e6d]/70 hover:text-primary transition-colors flex items-center justify-center p-1 rounded-md focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Register as Admin Option */}
                <div className="pt-0.5 text-left">
                  <label className="group relative flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-[#FFE5BF]/60 hover:bg-[#FFE5BF] transition-all cursor-pointer">
                    <div className="flex items-center h-4 sm:h-5 mt-0.5">
                      <input
                        id="is-admin"
                        name="isAdmin"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-white cursor-pointer accent-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 font-label-md text-xs sm:text-[13px] font-bold text-on-surface">
                        <span>Register as Studio Admin</span>
                      </div>
                      <p className="font-body-sm text-[10.5px] sm:text-[11px] text-[#666666] leading-snug mt-0.5">
                        Allows you to create events, manage team photographers, and publish galleries.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-0.5 sm:pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-on-primary font-headline-sm text-xs sm:text-sm font-bold py-2 sm:py-2.5 px-5 rounded-full hover:bg-primary-container active:scale-[0.99] transition-all duration-200 shadow-sm flex items-center justify-center gap-space-xs group focus:outline-none focus:ring-4 focus:ring-primary/25 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base mr-1">
                          progress_activity
                        </span>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:translate-x-1">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Account Switcher Link */}
              <div className="mt-2 sm:mt-2.5 text-center">
                <p className="font-body-sm text-[11px] sm:text-xs text-[#666666]">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-primary hover:underline focus:outline-none ml-1 transition-colors duration-200"
                  >
                    Log In
                  </Link>
                </p>
              </div>

              {/* Trust Footer Marker */}
              <div className="mt-2 sm:mt-2.5 flex items-center justify-center gap-1 text-on-secondary-fixed-variant">
                <span className="w-1 h-1 rounded-full bg-[#926e6d]/40" />
                <span className="font-label-sm text-[9.5px] sm:text-[10px] tracking-wide text-[#6e5c3e] font-medium">
                  End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex-shrink-0 flex items-center justify-center py-1.5 sm:py-2 text-center border-t border-[#F6D2B2]/40 bg-[#FFFAF3]/90 backdrop-blur-xl">
        <div className="w-full px-margin-mobile text-on-surface-variant font-label-sm text-[11px] sm:text-xs">
          © 2026 Momently. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
