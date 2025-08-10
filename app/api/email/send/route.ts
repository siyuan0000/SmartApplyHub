import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createAuthenticatedResponse } from '@/lib/supabase/api'
import { EmailService } from '@/lib/email/service'

// POST /api/email/send - Send email
export async function POST(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    const body = await request.json()
    const { to, subject, body: emailBody, jobApplicationId } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'To, subject, and body are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid recipient email address' },
        { status: 400 }
      )
    }

    let userId: string | undefined = undefined
    
    // Try to get user ID but don't fail if authentication fails
    try {
      const user = await getAuthenticatedUser(request, response)
      userId = user.id
    } catch {
      console.log('No authentication, will use env config only')
    }

    // TODO: Add resume attachment logic here
    // For now, we'll send without attachments
    await EmailService.sendEmail(userId, {
      to,
      subject,
      body: emailBody,
      jobApplicationId
    })

    return createAuthenticatedResponse({ 
      message: 'Email sent successfully',
      to,
      subject
    }, response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}