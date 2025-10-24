'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">MRP Forecast</h1>
          <p className="text-xs text-muted-foreground">Manajemen versi forecast</p>
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border bg-background p-2 text-sm shadow-sm"
          aria-label="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <nav className="border-t px-4 pb-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-xl px-4 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </header>
  )
}
