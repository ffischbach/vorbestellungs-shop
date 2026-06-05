import { redirect } from 'next/navigation'
import { db } from '@repo/database'
import clubConfig from '@/club.config'
import { SetupForm } from './setup-form'

export default async function SetupPage() {
  const existing = await db.user.count()
  if (existing > 0) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight">{clubConfig.name}</h1>
          <p className="text-sm text-muted-foreground">Admin-Account einrichten</p>
        </div>
        <SetupForm />
      </div>
    </main>
  )
}
