import type { AppProps } from 'next/app'
import '../src/index.css'

/**
 * Next entry point.
 * Global CSS stays unchanged so the rendered UI remains visually identical
 * while the hosting/runtime layer moves from Vite to Next.js.
 */
export default function SilkRoadHubApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
