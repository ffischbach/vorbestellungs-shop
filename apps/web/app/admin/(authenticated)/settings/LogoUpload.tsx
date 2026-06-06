'use client'

import { useRef, useState } from 'react'
import { uploadLogoAction } from '@/app/actions/upload'
import { Button } from '@/components/ui/button'

interface Props {
  currentLogoUrl: string
}

export function LogoUpload({ currentLogoUrl }: Props) {
  const [url, setUrl] = useState(currentLogoUrl)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setIsPending(true)

    const formData = new FormData()
    formData.set('file', file)
    const result = await uploadLogoAction(formData)

    setIsPending(false)

    if (result.success) {
      setUrl(result.url)
      if (inputRef.current) inputRef.current.value = ''
    } else {
      setError(result.error)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {url && (
        <div className="w-32 h-32 border border-border flex items-center justify-center bg-muted/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Vereinslogo" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? 'Lädt hoch…' : url ? 'Logo ersetzen' : 'Logo hochladen'}
        </Button>
        <span className="text-xs text-muted-foreground">JPEG, PNG oder WebP, max. 2 MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
