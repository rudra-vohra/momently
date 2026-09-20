/**
 * Button — Momently Design System
 * Variants: primary, secondary, ghost (per Stitch DESIGN.md)
 * Shape: rounded-full pill for all variants
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-full font-[family-name:var(--font-heading)] font-semibold
    transition-all duration-200 cursor-pointer select-none
    disabled:opacity-60 disabled:cursor-not-allowed
    active:scale-[0.98]
  `

  const sizeClasses = {
    sm: 'px-4 py-2 text-[0.8125rem]',
    md: 'px-6 py-3 text-[0.875rem]',
    lg: 'px-8 py-3.5 text-[0.9375rem]',
  }

  const variantClasses = {
    primary: `
      bg-primary text-on-primary
      hover:bg-primary-hover hover:shadow-[0_4px_14px_rgba(246,36,64,0.25)]
    `,
    secondary: `
      bg-secondary text-heading
      hover:bg-secondary-hover
    `,
    ghost: `
      bg-transparent text-heading
      hover:bg-secondary
    `,
    danger: `
      bg-error text-on-error
      hover:bg-[#a31717]
    `,
    outline: `
      bg-transparent text-heading border border-border
      hover:bg-surface
    `,
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">{icon}</span>
      )}
    </button>
  )
}
