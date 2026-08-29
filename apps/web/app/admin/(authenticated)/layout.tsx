import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionFromCookie } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { AdminNav } from './AdminNav'

export default async function AuthenticatedAdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookie()
  if (!session?.user) redirect('/admin/login')
  if (process.env.NODE_ENV === 'production' && !session.user.twoFactorEnabled) {
    redirect('/admin/setup-totp')
  }
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-background px-4 py-6 flex flex-col gap-1 print:hidden">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 px-3">
          Admin
        </p>
        <AdminNav />
        <form action={logoutAction} className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            Abmelden
          </Button>
        </form>
      </aside>
      <main className="flex-1 px-8 py-6 print:p-0">{children}</main>
      <div className="print:hidden">
        <Toaster position="bottom-right" />
      </div>
    </div>
  )
}
