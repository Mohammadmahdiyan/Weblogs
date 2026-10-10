import { Component, type ReactNode } from 'react'

interface MdxErrorBoundaryProps {
  name: string
  children: ReactNode
}

interface MdxErrorBoundaryState {
  failed: boolean
}

export class MdxErrorBoundary extends Component<MdxErrorBoundaryProps, MdxErrorBoundaryState> {
  state: MdxErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): MdxErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error(`Markdown component "${this.props.name}" failed`, error)
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="not-prose rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] p-3 text-sm text-[var(--text-muted)]">
          این مؤلفه قابل نمایش نیست.
        </div>
      )
    }

    return this.props.children
  }
}