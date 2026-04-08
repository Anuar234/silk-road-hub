import type { TrustBadge } from './mockData'

const TRUST_BADGE_LABELS: Record<TrustBadge, string> = {
  Verified: 'Проверен',
  Halal: 'Halal',
  'ISO 22000': 'ISO 22000',
  ISO: 'ISO',
}

export function getTrustBadgeLabel(badge: TrustBadge): string {
  return TRUST_BADGE_LABELS[badge] ?? badge
}
