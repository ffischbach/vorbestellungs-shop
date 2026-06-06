import { redirect } from 'next/navigation'
import { db } from '@repo/database'
import { LoginForm } from './login-form'
import { getClubConfig } from '@/club.config'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const [userCount, clubConfig] = await Promise.all([db.user.count(), getClubConfig()])
  if (userCount === 0) redirect('/admin/setup')

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm border bg-background p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-bold tracking-tight uppercase">{clubConfig.name}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Admin-Bereich</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
