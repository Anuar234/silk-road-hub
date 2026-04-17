import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-lg font-semibold text-red-900">Произошла ошибка</h2>
            <p className="mt-2 text-sm text-red-700">
              {this.state.error?.message ?? 'Неизвестная ошибка'}
            </p>
            <button
              type="button"
              onClick={() => { this.setState({ hasError: false, error: null }) }}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
