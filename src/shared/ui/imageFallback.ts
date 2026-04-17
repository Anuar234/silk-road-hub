import type { SyntheticEvent } from 'react'

const APPLIED_ATTR = 'data-offline-fallback-applied'

export function applyOfflineImageFallback(
  event: SyntheticEvent<HTMLImageElement>,
  fallbackSrc = '/offline-placeholder.svg',
) {
  const image = event.currentTarget
  if (image.getAttribute(APPLIED_ATTR) === 'true') {
    return
  }

  image.setAttribute(APPLIED_ATTR, 'true')
  image.src = fallbackSrc
}
