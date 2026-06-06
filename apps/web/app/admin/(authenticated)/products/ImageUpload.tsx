'use client'

import { useRef, useState } from 'react'
import { uploadImageAction, deleteImageAction } from '@/app/actions/upload'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  defaultImageUrl?: string
}

export function ImageUpload({ defaultImageUrl }: Props) {
  const [url, setUrl] = useState(defaultImageUrl ?? '')
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
    const result = await uploadImageAction(formData)

    setIsPending(false)

    if (result.success) {
      setUrl(result.url)
    } else {
      setError(result.error)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!url) return
    setIsPending(true)
    await deleteImageAction(url)
    setUrl('')
    setIsPending(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Produktbild
      </Label>

      <input type="hidden" name="imageUrl" value={url} />

      {url ? (
        <div className="relative w-32 h-32 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Produktbild" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center leading-none"
            aria-label="Bild entfernen"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? 'Lädt hoch…' : 'Bild auswählen'}
          </Button>
          <span className="text-xs text-muted-foreground">JPEG, PNG oder WebP, max. 5 MB</span>
        </div>
      )}

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
