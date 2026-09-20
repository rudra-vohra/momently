/**
 * Chip — Momently Design System
 * Filter chips with selected/unselected states per DESIGN.md
 * Pill shape, cream bg, border, dot indicator when selected
 */
export default function Chip({
  children,
  selected = false,
  onClick,
  icon,
  count,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        rounded-full
        font-[family-name:var(--font-body)] text-[0.875rem] font-medium
        transition-all duration-200
        cursor-pointer select-none
        ${selected
          ? 'bg-secondary text-heading border border-transparent shadow-sm'
          : 'bg-surface/60 text-muted border border-border hover:bg-surface hover:text-heading'
        }
        ${className}
      `}
    >
      {selected && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      <span>{children}</span>
      {count !== undefined && (
        <span className={`
          font-[family-name:var(--font-mono)] text-[0.75rem] font-semibold
          ${selected ? 'text-heading' : 'text-muted'}
        `}>
          {count}
        </span>
      )}
    </button>
  )
}
