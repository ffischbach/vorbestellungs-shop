import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@repo/database'
import { auth } from '@/lib/auth'
import clubConfig from '@/club.config'
import { TotpSetupForm } from './totp-setup-form'

export default async function SetupTotpPage() {
  if (process.env.NODE_ENV !== 'production') redirect('/admin')

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/admin/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  })
  if (user?.twoFactorEnabled) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight">{clubConfig.name}</h1>
          <p className="text-sm text-muted-foreground">Zwei-Faktor-Authentifizierung einrichten</p>
        </div>
        <TotpSetupForm />
      </div>
    </main>
  )
}
