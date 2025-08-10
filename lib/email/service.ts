import { supabaseLegacy } from '@/lib/supabase/legacy'
import { Database } from '@/types/database.types'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

type EmailSettingsRow = Database['public']['Tables']['email_settings']['Row']
type EmailSettingsInsert = Database['public']['Tables']['email_settings']['Insert']

type EmailLogRow = Database['public']['Tables']['email_logs']['Row']
type EmailLogInsert = Database['public']['Tables']['email_logs']['Insert']

export interface EmailConfig {
  email_address: string
  email_password: string
  smtp_host: string
  smtp_port: number
  use_tls: boolean
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  attachments?: EmailAttachment[]
  jobApplicationId?: string
}

// Encryption key - in production, this should be from environment variables
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'your-32-character-secret-key-here!'

export class EmailService {
  /**
   * Get email config from environment variables if available, otherwise from database
   */
  static async getEffectiveEmailConfig(userId?: string): Promise<EmailConfig | null> {
    // First try environment variables
    const envEmail = process.env.EMAIL_ACCOUNT
    const envPassword = process.env.EMAIL_PASSWORD
    
    if (envEmail && envPassword) {
      console.log('Using email config from environment variables')
      return {
        email_address: envEmail,
        email_password: envPassword,
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        use_tls: true
      }
    }
    
    // Fall back to database config if user ID is provided
    if (userId) {
      console.log('Falling back to database email config')
      return await this.getEmailConfig(userId)
    }
    
    return null
  }

  /**
   * Encrypt password for storage
   */
  private static encryptPassword(password: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(password, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  /**
   * Decrypt password from storage
   */
  private static decryptPassword(encryptedPassword: string): string {
    const parts = encryptedPassword.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  /**
   * Save or update user's email configuration
   */
  static async saveEmailConfig(userId: string, config: EmailConfig): Promise<EmailSettingsRow> {
    // Encrypt the password
    const encryptedPassword = this.encryptPassword(config.email_password)

    const emailSettings: EmailSettingsInsert = {
      user_id: userId,
      email_address: config.email_address,
      email_password: encryptedPassword,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      use_tls: config.use_tls,
      is_active: true
    }

    // Check if config already exists
    const { data: existing } = await supabaseLegacy
      .from('email_settings')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabaseLegacy
        .from('email_settings')
        .update({
          email_address: config.email_address,
          email_password: encryptedPassword,
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          use_tls: config.use_tls,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update email config: ${error.message}`)
      }
      return data
    } else {
      // Create new
      const { data, error } = await supabaseLegacy
        .from('email_settings')
        .insert(emailSettings)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save email config: ${error.message}`)
      }
      return data
    }
  }

  /**
   * Get user's email configuration
   */
  static async getEmailConfig(userId: string): Promise<EmailConfig | null> {
    const { data, error } = await supabaseLegacy
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    // Decrypt password
    const decryptedPassword = data.email_password 
      ? this.decryptPassword(data.email_password)
      : ''

    return {
      email_address: data.email_address,
      email_password: decryptedPassword,
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      use_tls: data.use_tls
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(config: EmailConfig): Promise<boolean> {
    try {
      // Import nodemailer dynamically to avoid bundling issues
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: config.email_address,
          pass: config.email_password,
        },
        tls: config.use_tls ? { rejectUnauthorized: false } : undefined
      })

      // Verify connection
      await transporter.verify()
      return true
    } catch (error) {
      console.error('Email config test failed:', error)
      return false
    }
  }

  /**
   * Send email using user's configuration or environment config
   */
  static async sendEmail(userId: string | undefined, options: SendEmailOptions): Promise<void> {
    // Get email configuration from env or database
    const config = await this.getEffectiveEmailConfig(userId)
    if (!config) {
      throw new Error('Email configuration not found. Please configure your email settings first or set EMAIL_ACCOUNT and EMAIL_PASSWORD environment variables.')
    }

    // Log the email attempt (only if we have a user ID)
    let logEntry: EmailLogRow | null = null
    if (userId) {
      const emailLog: EmailLogInsert = {
        user_id: userId,
        job_application_id: options.jobApplicationId || null,
        to_email: options.to,
        subject: options.subject,
        body: options.body,
        attachments: options.attachments ? JSON.stringify(options.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType
        }))) : JSON.stringify([]),
        status: 'pending'
      }

      const { data, error: logError } = await supabaseLegacy
        .from('email_logs')
        .insert(emailLog)
        .select()
        .single()

      if (logError) {
        console.error('Failed to log email:', logError)
      } else {
        logEntry = data
      }
    }

    try {
      // Import nodemailer dynamically
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.email_address,
          pass: config.email_password,
        },
        tls: config.use_tls ? { rejectUnauthorized: false } : undefined
      })

      const mailOptions = {
        from: config.email_address,
        to: options.to,
        subject: options.subject,
        text: options.body,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      }

      // Send the email
      await transporter.sendMail(mailOptions)

      // Update log status to sent
      if (logEntry) {
        await supabaseLegacy
          .from('email_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', logEntry.id)
      }

    } catch (error) {
      // Update log status to failed
      if (logEntry) {
        await supabaseLegacy
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', logEntry.id)
      }

      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get email logs for a user
   */
  static async getEmailLogs(userId: string, limit: number = 50): Promise<EmailLogRow[]> {
    const { data, error } = await supabaseLegacy
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch email logs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete user's email configuration
   */
  static async deleteEmailConfig(userId: string): Promise<void> {
    const { error } = await supabaseLegacy
      .from('email_settings')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete email config: ${error.message}`)
    }
  }
}