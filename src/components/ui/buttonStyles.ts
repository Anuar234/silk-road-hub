import { cx } from '../utils/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium motion-tap transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3',
    md: 'h-11 px-4',
  }

  const variants: Record<ButtonVariant, string> = {
    primary:
      'border-brand-blue bg-brand-blue text-white hover:bg-brand-blue-2 hover:border-brand-blue-2',
    secondary: 'border-border bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'border-transparent bg-transparent text-slate-900 hover:bg-slate-100',
  }

  return cx(base, sizes[size], variants[variant], className)
}

