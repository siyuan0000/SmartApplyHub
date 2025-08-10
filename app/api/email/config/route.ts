import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, createAuthenticatedResponse } from '@/lib/supabase/api'
import { EmailService, type EmailConfig } from '@/lib/email/service'

// GET /api/email/config - Get user's email configuration
export async function GET(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    let userId: string | undefined = undefined
    
    // Try to get user ID but don't fail if authentication fails
    try {
      const user = await getAuthenticatedUser(request, response)
      userId = user.id
    } catch {
      console.log('No authentication, will use env config only')
    }
    
    // Get email configuration from env or database
    const config = await EmailService.getEffectiveEmailConfig(userId)
    
    if (!config) {
      return createAuthenticatedResponse({ config: null }, response)
    }

    // Return config without password for security
    const safeConfig = {
      email_address: config.email_address,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      use_tls: config.use_tls,
      has_password: !!config.email_password,
      from_env: !userId || (!process.env.EMAIL_ACCOUNT ? false : true)
    }

    return createAuthenticatedResponse({ config: safeConfig }, response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/email/config - Save or update email configuration
export async function POST(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    const body = await request.json()
    const { email_address, email_password, smtp_host, smtp_port, use_tls } = body

    if (!email_address || !email_password) {
      return NextResponse.json(
        { error: 'Email address and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_address)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, response)

    const config: EmailConfig = {
      email_address,
      email_password,
      smtp_host: smtp_host || 'smtp-mail.outlook.com',
      smtp_port: smtp_port || 587,
      use_tls: use_tls !== false // default to true
    }

    // Test the configuration before saving
    const isValid = await EmailService.testEmailConfig(config)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email configuration. Please check your credentials and settings.' },
        { status: 400 }
      )
    }

    // Save configuration
    await EmailService.saveEmailConfig(user.id, config)

    return NextResponse.json({ 
      message: 'Email configuration saved successfully',
      config: {
        email_address: config.email_address,
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        use_tls: config.use_tls
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/config - Delete email configuration
export async function DELETE(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    // Authenticate user
    const user = await getAuthenticatedUser(request, response)
    
    // Delete configuration
    await EmailService.deleteEmailConfig(user.id)

    return createAuthenticatedResponse({ message: 'Email configuration deleted successfully' }, response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}