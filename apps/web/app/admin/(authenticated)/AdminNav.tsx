'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }

type NavGroup = { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    title: 'Betrieb',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/orders', label: 'Bestellungen', icon: ClipboardList },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { href: '/admin/products', label: 'Produkte', icon: Package },
      { href: '/admin/categories', label: 'Kategorien', icon: FolderTree },
      { href: '/admin/slots', label: 'Zeitslots', icon: Clock },
      { href: '/admin/import', label: 'Setup-Import', icon: Upload },
      { href: '/admin/rules', label: 'Validierungsregeln', icon: ShieldCheck },
    ],
  },
]

function NavLink({ href, label, icon: Icon, exact }: NavItem) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted',
      )}
    >
      <Icon className="size-4" />
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
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
            isSettings
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings className="size-4" />
          Vereinseinstellungen
        </Link>
      </div>
    </nav>
  )
}
