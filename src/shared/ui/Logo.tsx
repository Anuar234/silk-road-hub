import { cx } from '@shared/lib/cx'

const LOGO_SRC = '/logo-main.svg?v=1'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-14',
  md: 'h-[3.75rem]',
  lg: 'h-24',
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span
      className={cx(
        'inline-flex overflow-hidden rounded-2xl',
        className,
      )}
    >
      <img
        src={LOGO_SRC}
        alt="Silk Road Hub"
        className={cx(
          'w-auto object-contain object-center transition-opacity duration-200 hover:opacity-90',
          sizeClasses[size],
        )}
        style={{ imageRendering: 'auto' }}
        onError={(event) => {
          event.currentTarget.src = '/offline-placeholder.svg'
        }}
        decoding="async"
        fetchPriority="high"
      />
    </span>
  )
}
