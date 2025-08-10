import { NextResponse } from 'next/server'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json({ 
    message: 'About API is working',
    timestamp: new Date().toISOString()
  }, {
    headers: { 
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
} 