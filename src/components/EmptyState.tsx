import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-16 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-10 w-10 text-secondary-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5"
        />
      </svg>
      <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
      <p className="max-w-md text-sm text-secondary-500">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
