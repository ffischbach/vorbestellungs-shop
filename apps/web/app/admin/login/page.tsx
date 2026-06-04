import { LoginForm } from './login-form'
import clubConfig from '@/club.config'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight">{clubConfig.name}</h1>
          <p className="text-sm text-muted-foreground">Admin-Bereich</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
