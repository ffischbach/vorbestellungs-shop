import clubConfig from '@/club.config'
import { TotpLoginForm } from './totp-login-form'

export default function TotpLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight">{clubConfig.name}</h1>
          <p className="text-sm text-muted-foreground">Zwei-Faktor-Code eingeben</p>
        </div>
        <TotpLoginForm />
      </div>
    </main>
  )
}
