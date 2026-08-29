'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; exact?: boolean }

type NavGroup = { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    title: 'Betrieb',
    items: [
      { href: '/admin', label: 'Dashboard', exact: true },
      { href: '/admin/orders', label: 'Bestellungen' },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { href: '/admin/products', label: 'Produkte' },
      { href: '/admin/categories', label: 'Kategorien' },
      { href: '/admin/slots', label: 'Zeitslots' },
      { href: '/admin/import', label: 'Setup-Import' },
    ],
  },
]

function NavLink({ href, label, exact }: NavItem) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted',
      )}
    >
      {label}
    </Link>
  )
}

export function AdminNav() {
  const pathname = usePathname()
  const isSettings = pathname.startsWith('/admin/settings')

  return (
    <nav className="flex flex-col gap-4 flex-1">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-auto">
        <Link
          href="/admin/settings"
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors block',
            isSettings
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          Vereinseinstellungen
        </Link>
      </div>
    </nav>
  )
}
