import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stock Desk — Product Inventory',
  description: 'Track stock levels, spot low-cover SKUs and add products to the catalogue.',
}

const NAV_LINKS = [
  { href: '/', label: 'Inventory' },
  { href: '/products', label: 'Add product' },
] as const

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 border-b border-secondary-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2.5 rounded-lg">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white"
                >
                  SD
                </span>
                <span className="text-base font-semibold tracking-tight text-secondary-900">
                  Stock Desk
                </span>
              </Link>
              <nav aria-label="Main" className="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 transition-colors hover:bg-secondary-100 hover:text-secondary-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-secondary-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-secondary-400 sm:px-6 lg:px-8">
              Catalogue is served from an in-memory repository — changes last until the server
              restarts.
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
