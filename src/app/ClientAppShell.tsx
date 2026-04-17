import Head from 'next/head'
import dynamic from 'next/dynamic'

/**
 * The existing product behavior is tightly coupled to react-router's
 * HashRouter and offline `/#/...` entry points. To preserve that contract
 * during the platform migration, the UI continues to run as a client-only SPA
 * inside Next.js while Next takes over build/export/runtime responsibilities.
 */
const RoutedApp = dynamic(
  async () => {
    const [{ HashRouter }, { default: App }] = await Promise.all([
      import('react-router-dom'),
      import('@app/App'),
    ])

    return function RoutedAppShell() {
      return (
        <HashRouter>
          <App />
        </HashRouter>
      )
    }
  },
  { ssr: false },
)

export function ClientAppShell() {
  return (
    <>
      <Head>
        <title>Silk Road Hub</title>
      </Head>
      <RoutedApp />
    </>
  )
}
