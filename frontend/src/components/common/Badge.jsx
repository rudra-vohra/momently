/**
 * Badge — Momently Design System
 * Status badges: Published (green), Draft (amber), info, etc.
 * Pill shape with dot indicator
 */
export default function Badge({ children, variant = 'published', className = '' }) {
  const variants = {
    published: 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]',
    draft: 'bg-[#fff8e1] text-[#e65100] border-[#ffe0b2]',
    info: 'bg-secondary/60 text-heading border-border',
    error: 'bg-error-container text-on-error-container border-[#ffcdd2]',
    member: 'bg-[#f3e5f5] text-[#7b1fa2] border-[#e1bee7]',
    admin: 'bg-primary/10 text-primary border-primary/20',
  }

  const dotColors = {
    published: 'bg-[#2e7d32]',
    draft: 'bg-[#e65100]',
    info: 'bg-heading',
    error: 'bg-error',
    member: 'bg-[#7b1fa2]',
    admin: 'bg-primary',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1
        rounded-full
        border
        font-[family-name:var(--font-mono)] text-[0.6875rem] font-semibold leading-[0.875rem] tracking-[0.04em] uppercase
        ${variants[variant]}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  )
}
