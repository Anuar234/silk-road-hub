/**
 * Compatibility helpers for react-router `location.state`.
 * These wrappers centralize the current implicit contracts used for
 * return-navigation and seller-product flash messages.
 */
type NavigationState = unknown

export function getNavigationFrom(state: NavigationState): string | null {
  if (typeof state !== 'object' || state === null) return null
  if (!('from' in state)) return null
  return typeof state.from === 'string' ? state.from : null
}

export function getNavigationFlash(state: NavigationState): string | null {
  if (typeof state !== 'object' || state === null) return null
  if (!('flash' in state)) return null
  return typeof state.flash === 'string' ? state.flash : null
}

export function buildFromState(from: string): { from: string } {
  return { from }
}

export function buildFlashState(flash: string): { flash: string } {
  return { flash }
}
