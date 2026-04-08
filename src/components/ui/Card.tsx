import { cx } from '../utils/cx'

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cx('rounded-2xl border border-border bg-white motion-card', className)}>{children}</div>
  )
}

export function CardHeader({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cx('px-5 pt-5', className)}>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
    </div>
  )
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cx('px-5 pb-5 pt-4', className)}>{children}</div>
}

