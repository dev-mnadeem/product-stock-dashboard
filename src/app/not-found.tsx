import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="surface mx-auto max-w-lg px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-secondary-900">Page not found</h1>
      <p className="mt-2 text-sm text-secondary-500">
        That route is not part of Stock Desk. The inventory table is the place to start.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        Back to inventory
      </Link>
    </div>
  )
}
