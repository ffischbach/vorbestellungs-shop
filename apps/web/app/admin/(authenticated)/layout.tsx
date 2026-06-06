import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionFromCookie } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Produkte' },
  { href: '/admin/categories', label: 'Kategorien' },
  { href: '/admin/slots', label: 'Zeitslots' },
  { href: '/admin/orders', label: 'Bestellungen' },
]

export default async function AuthenticatedAdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookie()
  if (!session?.user) redirect('/admin/login')
  if (process.env.NODE_ENV === 'production' && !session.user.twoFactorEnabled) {
    redirect('/admin/setup-totp')
  }
  return (
      <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-background px-5 py-6 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Admin</p>
        <nav className="flex flex-col gap-0.5 text-sm flex-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="px-3 py-2 hover:bg-muted font-medium text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit" className="w-full justify-start text-muted-foreground hover:text-foreground">
            Abmelden
          </Button>
        </form>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  )
}
