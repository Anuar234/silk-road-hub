import { cx } from '../utils/cx'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'info'
  className?: string
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    neutral: 'border-border bg-white text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-brand-yellow-soft text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

