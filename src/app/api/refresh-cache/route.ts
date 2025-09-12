import { NextRequest, NextResponse } from 'next/server'

// This is a simple API route that helps clear cache
// It doesn't actually do anything except return cache control headers
// to ensure fresh data is fetched

export async function HEAD(request: NextRequest) {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  
  return NextResponse.json({ success: true, timestamp: new Date().toISOString() }, { headers })
}