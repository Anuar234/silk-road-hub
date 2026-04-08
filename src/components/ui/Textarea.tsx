import type React from 'react'
import { cx } from '../utils/cx'

export function Textarea({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      className={cx(
        'min-h-28 w-full resize-y rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
        className,
      )}
      {...props}
    />
  )
}

