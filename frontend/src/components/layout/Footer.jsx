import logoSrc from '../../assets/images/momently-logo.png'

/**
 * Footer — Momently Design System
 * Two variants: landing (with credits) and dashboard (with status)
 */
export default function Footer({ variant = 'landing' }) {
  if (variant === 'dashboard') {
    return (
      <footer className="w-full border-t border-border/30 bg-[rgba(255,250,243,0.85)] backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[0.6875rem] font-[family-name:var(--font-body)] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>All systems operational · Encrypted Studio Storage</span>
          </div>
          <span className="text-[0.6875rem] font-[family-name:var(--font-body)] text-muted">
            © 2026 Momently. All rights reserved.
          </span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="w-full bg-canvas border-t border-border/30">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <img src={logoSrc} alt="Momently" className="h-4.5 w-auto opacity-70" />
        <div className="flex items-center gap-3 text-[0.6875rem] font-[family-name:var(--font-body)] text-muted">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">code</span>
            Built by Rudra Vohra
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">code</span>
            GitHub
          </span>
        </div>
        <span className="text-[0.6875rem] font-[family-name:var(--font-body)] text-muted">
          © 2026 Momently. All rights reserved.
        </span>
      </div>
    </footer>
  )
}

/**
 * Minimal footer for public gallery pages
 */
export function GalleryFooter() {
  return (
    <footer className="w-full py-4 flex items-center justify-center gap-1.5 text-xs text-stone-500 font-medium tracking-wide">
      <span className="leading-none">Powered by</span>
      <span className="inline-flex items-center">
        <img
          src={logoSrc}
          alt="momently"
          className="h-3.5 w-auto block opacity-85 translate-y-[0.5px]"
        />
      </span>
    </footer>
  )
}
