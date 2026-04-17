import { ClientAppShell } from '@app/ClientAppShell'

/**
 * Next.js root page delegates rendering to the compatibility shell so the
 * existing routed application can continue to own behavior during migration.
 */
export default function HomePage() {
  return <ClientAppShell />
}
