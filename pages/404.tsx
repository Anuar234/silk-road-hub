import { ClientAppShell } from '@app/ClientAppShell'

/**
 * Even unknown static paths should land in the same client-side shell so that
 * hash-based compatibility links keep working after export/server fallbacks.
 */
export default function NotFoundFallbackPage() {
  return <ClientAppShell />
}
