'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { uploadFile, deleteFile, isAllowedImageType, isAllowedExtension, isWithinSizeLimit } from '@/lib/storage'
import { getClubConfigFromDb, upsertClubConfig } from '@repo/database'
import { revalidatePath } from 'next/cache'

type UploadResult = { success: true; url: string } | { success: false; error: string }
type DeleteResult = { success: true } | { success: false; error: string }

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session ?? null
}

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  if (!(await requireAdmin())) return { success: false, error: 'Nicht authentifiziert' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'Keine Datei angegeben' }
  if (!isAllowedImageType(file.type) || !isAllowedExtension(file.name)) {
    return { success: false, error: 'Ungültiger Dateityp (erlaubt: JPEG, PNG, WebP)' }
  }
  if (!isWithinSizeLimit(file.size)) return { success: false, error: 'Datei zu groß (max. 5 MB)' }

  try {
    const url = await uploadFile(file, 'products')
    return { success: true, url }
  } catch {
    return { success: false, error: 'Upload fehlgeschlagen' }
  }
}

export async function uploadLogoAction(formData: FormData): Promise<UploadResult> {
  if (!(await requireAdmin())) return { success: false, error: 'Nicht authentifiziert' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'Keine Datei angegeben' }
  if (!isAllowedImageType(file.type) || !isAllowedExtension(file.name)) {
    return { success: false, error: 'Ungültiger Dateityp (erlaubt: JPEG, PNG, WebP)' }
  }
  if (file.size > 2 * 1024 * 1024) return { success: false, error: 'Datei zu groß (max. 2 MB)' }

  try {
    const existing = await getClubConfigFromDb()
    const oldLogoUrl = existing?.logoUrl

    const url = await uploadFile(file, 'logos')
    await upsertClubConfig({ logoUrl: url })
    revalidatePath('/', 'layout')

    if (oldLogoUrl) {
      const publicUrl = process.env.S3_PUBLIC_URL
      if (publicUrl && oldLogoUrl.startsWith(publicUrl)) {
        try { await deleteFile(oldLogoUrl) } catch { /* Altes Logo nicht kritisch */ }
      }
    }

    return { success: true, url }
  } catch {
    return { success: false, error: 'Upload fehlgeschlagen' }
  }
}

export async function deleteImageAction(url: string): Promise<DeleteResult> {
  if (!(await requireAdmin())) return { success: false, error: 'Nicht authentifiziert' }

  const publicUrl = process.env.S3_PUBLIC_URL
  if (!publicUrl || !url.startsWith(publicUrl)) {
    return { success: false, error: 'Ungültige URL' }
  }

  try {
    await deleteFile(url)
    return { success: true }
  } catch {
    return { success: false, error: 'Löschen fehlgeschlagen' }
  }
}
