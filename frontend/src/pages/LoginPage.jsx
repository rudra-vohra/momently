import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSrc from '../assets/images/momently-logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="bg-[#FFFAF3] font-body-md text-on-surface h-screen max-h-screen flex flex-col justify-between overflow-y-auto overflow-x-hidden w-full max-w-full lg:overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Header */}
      <header className="w-full flex-shrink-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-xl border-b border-[#F6D2B2]/40 shadow-[0_1px_8px_rgba(80,50,20,0.04)]">
        <div className="h-14 sm:h-16 w-full px-margin-mobile md:px-space-xl lg:px-margin flex items-center justify-between">
          <Link to="/" className="momently-logo focus:outline-none">
            <img
              src={logoSrc}
              alt="Momently"
              className="h-7 sm:h-8 w-auto object-contain block"
            />
          </Link>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="w-full max-w-full flex-1 flex flex-col justify-center items-center px-4 py-2 sm:py-3 min-h-0 overflow-x-hidden">
        <div className="flex flex-col w-full max-w-full items-center justify-center relative isolate my-auto">
          {/* Card Container */}
          <div className="w-full max-w-[420px] px-2 sm:px-0 relative z-10">
            <div className="bg-[#FFF2DB] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_16px_40px_-12px_rgba(80,50,20,0.08),0_4px_16px_-2px_rgba(80,50,20,0.04)] relative overflow-hidden border border-[#F6D2B2]/60 animate-modal-pop-in">
              <div className="mb-4 sm:mb-5">
                <h1 className="font-headline-md text-xl sm:text-2xl text-on-surface font-bold tracking-tight mb-1">
                  Welcome back
                </h1>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                  Log in to manage your events and live photo galleries.
                </p>
              </div>

              {error && (
                <div className="mb-3.5 p-3 rounded-xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 flex items-center justify-center gap-2 text-center">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg leading-none select-none">
                    error
                  </span>
                  <p className="font-body-sm text-xs text-[#ba1a1a] leading-tight font-medium">
                    {error}
                  </p>
                </div>
              )}

              <form className="space-y-3 sm:space-y-3.5" onSubmit={handleLoginSubmit}>
                {/* Email Field */}
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block font-label-md text-xs sm:text-sm text-on-surface font-semibold"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.com"
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl px-3.5 py-2.5 placeholder:text-on-surface-variant/40 outline-none focus:bg-white transition-all shadow-sm border-2 border-transparent focus:border-primary focus:ring-3 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block font-label-md text-xs sm:text-sm text-on-surface font-semibold"
                    >
                      Password
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => e.preventDefault()}
                      className="font-label-sm text-xs text-primary hover:underline transition-colors cursor-pointer"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl px-3.5 py-2.5 pr-10 placeholder:text-on-surface-variant/40 outline-none focus:bg-white transition-all shadow-sm border-2 border-transparent focus:border-primary focus:ring-3 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-1 text-secondary hover:text-on-surface transition-colors rounded-lg flex items-center justify-center focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg leading-none select-none">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-1.5 sm:pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-on-primary font-headline-sm text-sm font-bold py-3 px-6 rounded-full hover:bg-primary-container active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-space-xs group cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Log In</span>
                        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Register & Security Badge */}
              <div className="mt-4 sm:mt-5 pt-3 border-t-0 flex flex-col items-center justify-center gap-1 text-center">
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Register
                  </Link>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim" />
                  <span className="font-metadata-badge text-[11px] text-tertiary">
                    End-to-End Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex-shrink-0 flex items-center justify-center py-2.5 text-center border-t border-[#F6D2B2]/40 bg-[#FFFAF3]/90 backdrop-blur-xl">
        <div className="w-full px-margin-mobile text-on-surface-variant font-label-sm text-xs tracking-normal">
          © 2026 Momently. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
