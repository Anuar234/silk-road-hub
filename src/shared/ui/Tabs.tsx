import { cx } from '@shared/lib/cx'

export type TabOption<T extends string> = { id: T; label: string }

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: Array<TabOption<T>>
  className?: string
}) {
  return (
    <div className={cx('inline-flex rounded-2xl border border-border bg-white p-1', className)}>
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cx(
              'min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium outline-none motion-tap transition-[color,background-color] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2 sm:min-h-0 sm:h-9 sm:px-3 sm:py-0',
              active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

