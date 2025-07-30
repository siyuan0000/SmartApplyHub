import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api'
import { EmailService } from '@/lib/email/service'

// GET /api/email/logs - Get user's email logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let userId: string | undefined = undefined
    
    // Try to get user ID but don't fail if authentication fails
    try {
      const user = await getAuthenticatedUser(request)
      userId = user.id
    } catch {
      console.log('No authentication, cannot get email logs')
      return NextResponse.json({ logs: [] })
    }
    
    // Get email logs
    const logs = await EmailService.getEmailLogs(userId, limit)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}