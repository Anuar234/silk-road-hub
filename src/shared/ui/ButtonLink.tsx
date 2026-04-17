import type React from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@shared/ui/buttonStyles'

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  return (
    <Link
      to={to}
      className={buttonClassName({ variant, size, className })}
      {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    />
  )
}

