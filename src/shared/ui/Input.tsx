import type React from 'react'
import { cx } from '@shared/lib/cx'

export function Input({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      className={cx(
        'h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
        className,
      )}
      {...props}
    />
  )
}

