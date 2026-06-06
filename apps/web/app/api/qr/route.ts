import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get('data')
  if (!data || data.length > 100) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const buffer = await QRCode.toBuffer(data, {
    width: 200,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' },
  })

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
