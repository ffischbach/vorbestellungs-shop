import { LoginForm } from './login-form'
import clubConfig from '@/club.config'

export default function LoginPage() {
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
