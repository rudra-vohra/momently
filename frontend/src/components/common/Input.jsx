import { useState } from 'react'

/**
 * Input — Momently Design System
 * Cream fill (#FFF2DB or white), rounded-xl, crimson focus ring
 * Password variant includes toggle visibility
 */
export default function Input({
  label,
  type = 'text',
  placeholder,
  name,
  id,
  value,
  onChange,
  required = false,
  autoComplete,
  icon,
  error,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block font-[family-name:var(--font-body)] text-[0.875rem] font-semibold leading-[1.25rem] tracking-[0.01em] text-heading"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={inputType}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`
            w-full bg-surface-white text-heading
            font-[family-name:var(--font-body)] text-[1rem] leading-[1.5rem]
            px-4 py-3.5 rounded-xl
            border-2 border-transparent
            placeholder:text-outline/40
            outline-none
            transition-all duration-200
            shadow-sm
            focus:border-primary focus:shadow-[0_0_0_3px_rgba(246,36,64,0.15)] focus:bg-white
            ${isPassword ? 'pr-12' : icon ? 'pr-12' : ''}
            ${error ? 'border-error shadow-[0_0_0_3px_rgba(186,26,26,0.15)]' : ''}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1.5 text-outline/70 hover:text-primary transition-colors rounded-lg flex items-center justify-center cursor-pointer"
            aria-label="Toggle password visibility"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
        {!isPassword && icon && (
          <span className="material-symbols-outlined absolute right-3.5 text-outline/50 pointer-events-none text-[20px]">
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-[0.75rem] text-error font-medium mt-1">{error}</p>
      )}
    </div>
  )
}
