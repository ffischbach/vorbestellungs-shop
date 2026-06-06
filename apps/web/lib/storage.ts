import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import path from 'path'

function createClient() {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_BUCKET_NAME
  const publicUrl = process.env.S3_PUBLIC_URL
  const region = process.env.S3_REGION ?? 'fsn1'
  if (!endpoint) throw new Error('S3_ENDPOINT ist nicht konfiguriert')
  if (!bucket) throw new Error('S3_BUCKET_NAME ist nicht konfiguriert')
  if (!publicUrl) throw new Error('S3_PUBLIC_URL ist nicht konfiguriert')
  return { client: new S3Client({ endpoint, region, forcePathStyle: false }), bucket, publicUrl }
}

// SVG absichtlich ausgeschlossen — SVGs können eingebettetes JavaScript enthalten
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_BYTES = 5 * 1024 * 1024

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType)
}

export function isAllowedExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

export function isWithinSizeLimit(bytes: number): boolean {
  return bytes <= MAX_BYTES
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const { client, bucket, publicUrl } = createClient()
  const ext = path.extname(file.name).toLowerCase()
  const key = `${folder}/${randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }),
  )

  return `${publicUrl}/${key}`
}

export async function deleteFile(publicUrl: string): Promise<void> {
  const { client, bucket, publicUrl: configuredPublicUrl } = createClient()
  if (!publicUrl.startsWith(configuredPublicUrl + '/')) {
    throw new Error('URL gehört nicht zu diesem Bucket')
  }
  const key = publicUrl.slice(configuredPublicUrl.length + 1)
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
