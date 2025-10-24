'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r bg-background/80 p-6 shadow-md backdrop-blur lg:flex">
      <div className="mb-10">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          MRP Forecast
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Versi forecast per bulan dengan delta insight
        </p>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-10 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Stair Forecast Platform
      </div>
    </aside>
  )
}
