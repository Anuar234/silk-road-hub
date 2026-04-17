import type React from 'react'
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@shared/ui/buttonStyles'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type ButtonAsButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type ButtonAsAnchorProps = CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }

export function Button(props: ButtonAsButtonProps): React.ReactElement
export function Button(props: ButtonAsAnchorProps): React.ReactElement
export function Button(props: ButtonAsButtonProps | ButtonAsAnchorProps) {
  const { variant = 'primary', size = 'md', className } = props
  const classes = buttonClassName({ variant, size, className })

  if (props.as === 'a') {
    const { as, variant, size, className, ...rest } = props
    void as
    void variant
    void size
    void className
    return <a className={classes} {...rest} />
  }

  const { as, variant: buttonVariant, size: buttonSize, className: buttonClass, ...rest } = props
  void as
  void buttonVariant
  void buttonSize
  void buttonClass
  return <button className={classes} {...rest} />
}

