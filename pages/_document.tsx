import Document, { Head, Html, Main, NextScript, type DocumentContext } from 'next/document'

/**
 * Preserves the previous HTML shell metadata so the Next.js version keeps
 * the same language, title, and font-loading behavior as the Vite app.
 */
type Props = {
  nonce?: string
}

export default class SrhDocument extends Document<Props> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    const raw = ctx.req?.headers['x-srh-nonce']
    const nonce = Array.isArray(raw) ? raw[0] : raw
    return { ...initialProps, nonce: typeof nonce === 'string' ? nonce : undefined }
  }

  render() {
    const nonce = this.props.nonce
    return (
      <Html lang="ru">
        <Head nonce={nonce}>
          <meta charSet="UTF-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    )
  }
}
