import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { notificationService } from '@/lib/notification-service'

export interface SecurePasswordResetOptions {
  adminId: string
  targetUserId: string
  reason?: string
  notifyUser?: boolean
}

export interface PasswordResetResult {
  success: boolean
  newPassword?: string
  error?: string
  auditLogId?: string
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  permissions: string
}

interface TargetUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  department: string | null
}

export class SecurePasswordResetService {
  private static instance: SecurePasswordResetService
  
  // Character sets for password generation
  private readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  private readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
  private readonly NUMBERS = '0123456789'
  private readonly SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  private constructor() {}
  
  public static getInstance(): SecurePasswordResetService {
    if (!SecurePasswordResetService.instance) {
      SecurePasswordResetService.instance = new SecurePasswordResetService()
    }
    return SecurePasswordResetService.instance
  }

  /**
   * Generate a cryptographically secure password
   */
  private generateSecurePassword(length: number = 16): string {
    if (length < 12) {
      throw new Error('Password length must be at least 12 characters')
    }

    const allChars = this.UPPERCASE + this.LOWERCASE + this.NUMBERS + this.SPECIAL_CHARS
    let password = ''

    // Ensure at least one character from each set
    password += this.getRandomChar(this.UPPERCASE)
    password += this.getRandomChar(this.LOWERCASE)
    password += this.getRandomChar(this.NUMBERS)
    password += this.getRandomChar(this.SPECIAL_CHARS)

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars)
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password)
  }

  /**
   * Get a cryptographically secure random character from a character set
   */
  private getRandomChar(charset: string): string {
    const randomBytes = crypto.randomBytes(1)
    const randomIndex = randomBytes[0] % charset.length
    return charset[randomIndex]
  }

  /**
   * Shuffle a string using Fisher-Yates algorithm with crypto.randomBytes
   */
  private shuffleString(str: string): string {
    const arr = str.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const randomBytes = crypto.randomBytes(4)
      const randomValue = randomBytes.readUInt32BE(0)
      const j = randomValue % (i + 1)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.join('')
  }

  /**
   * Validate admin permissions for password reset
   */
  private async validateAdminPermissions(adminId: string): Promise<{ valid: boolean; admin?: AdminUser; error?: string }> {
    try {
      const admin = await db.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          permissions: true
        }
      })

      if (!admin) {
        return { valid: false, error: 'Admin user not found' }
      }

      if (admin.status !== 'ACTIVE') {
        return { valid: false, error: 'Admin account is not active' }
      }

      if (admin.role !== 'ADMIN') {
        return { valid: false, error: 'Insufficient privileges - ADMIN role required' }
      }

      return { valid: true, admin }
    } catch (error) {
      console.error('Error validating admin permissions:', error)
      return { valid: false, error: 'Failed to validate admin permissions' }
    }
  }

  /**
   * Validate target user for password reset
   */
  private async validateTargetUser(targetUserId: string): Promise<{ valid: boolean; user?: TargetUser; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          department: true
        }
      })

      if (!user) {
        return { valid: false, error: 'Target user not found' }
      }

      // Prevent password reset for other admins (additional security)
      if (user.role === 'ADMIN') {
        return { valid: false, error: 'Cannot reset password for other administrators' }
      }

      return { valid: true, user }
    } catch (error) {
      console.error('Error validating target user:', error)
      return { valid: false, error: 'Failed to validate target user' }
    }
  }

  /**
   * Invalidate all existing sessions for a user
   */
  private async invalidateUserSessions(userId: string): Promise<void> {
    try {
      // Update user's updatedAt timestamp to invalidate JWT tokens
      await db.user.update({
        where: { id: userId },
        data: { 
          updatedAt: new Date(),
          // Add a session invalidation timestamp for additional security
          lastSignIn: null
        }
      })

      console.log(`Invalidated sessions for user: ${userId}`)
    } catch (error) {
      console.error('Error invalidating user sessions:', error)
      throw new Error('Failed to invalidate user sessions')
    }
  }

  /**
   * Create comprehensive audit log entry
   */
  private async createAuditLog(
    adminId: string, 
    targetUserId: string, 
    targetUserEmail: string,
    reason?: string
  ): Promise<string> {
    try {
      const auditLog = await db.auditLog.create({
        data: {
          action: 'ADMIN_PASSWORD_RESET',
          entity: 'User',
          entityId: targetUserId,
          performedBy: adminId,
          details: JSON.stringify({
            targetUserEmail,
            reason: reason || 'Administrative password reset',
            timestamp: new Date().toISOString(),
            securityLevel: 'HIGH',
            method: 'SECURE_ADMIN_RESET'
          }),
        },
      })

      return auditLog.id
    } catch (error) {
      console.error('Error creating audit log:', error)
      throw new Error('Failed to create audit log')
    }
  }

  /**
   * Send secure notification to user about password change
   */
  private async sendPasswordChangeNotification(
    targetUserId: string, 
    targetUserEmail: string,
    adminEmail: string
  ): Promise<void> {
    try {
      await notificationService.createNotification({
        type: 'SECURITY_ALERT',
        title: 'Password Reset by Administrator',
        message: `Your password has been reset by an administrator (${adminEmail}). If you did not request this change, please contact your system administrator immediately.`,
        priority: 'HIGH',
        targetUserId,
        category: 'SECURITY',
        actionUrl: '/profile',
        actionLabel: 'Update Profile',
        metadata: {
          securityEvent: true,
          adminInitiated: true,
          timestamp: new Date().toISOString()
        }
      })

      console.log(`Password change notification sent to user: ${targetUserEmail}`)
    } catch (error) {
      console.error('Error sending password change notification:', error)
      // Don't throw here - notification failure shouldn't stop the password reset
    }
  }

  /**
   * Perform secure administrative password reset
   */
  async resetUserPassword(options: SecurePasswordResetOptions): Promise<PasswordResetResult> {
    const { adminId, targetUserId, reason, notifyUser = true } = options

    try {
      // Validate admin permissions
      const adminValidation = await this.validateAdminPermissions(adminId)
      if (!adminValidation.valid) {
        return {
          success: false,
          error: adminValidation.error
        }
      }

      // Validate target user
      const userValidation = await this.validateTargetUser(targetUserId)
      if (!userValidation.valid) {
        return {
          success: false,
          error: userValidation.error
        }
      }

      const admin = adminValidation.admin!
      const targetUser = userValidation.user!

      // Generate cryptographically secure password
      const newPassword = this.generateSecurePassword(16)

      // Hash the new password with high cost factor
      const hashedPassword = await bcrypt.hash(newPassword, 14)

      // Start database transaction for atomic operations
      const result = await db.$transaction(async (tx) => {
        // Update user password
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        })

        // Create audit log
        const auditLogId = await this.createAuditLog(
          adminId,
          targetUserId,
          targetUser.email,
          reason
        )

        return { auditLogId }
      })

      // Invalidate existing sessions (outside transaction to avoid locks)
      await this.invalidateUserSessions(targetUserId)

      // Send notification if requested
      if (notifyUser) {
        await this.sendPasswordChangeNotification(
          targetUserId,
          targetUser.email,
          admin.email
        )
      }

      return {
        success: true,
        newPassword, // This will be displayed only once
        auditLogId: result.auditLogId
      }

    } catch (error) {
      console.error('Error in secure password reset:', error)
      return {
        success: false,
        error: 'Failed to reset password due to system error'
      }
    }
  }

  /**
   * Generate multiple secure passwords for selection (optional feature)
   */
  generatePasswordOptions(count: number = 3, length: number = 16): string[] {
    const passwords: string[] = []
    for (let i = 0; i < count; i++) {
      passwords.push(this.generateSecurePassword(length))
    }
    return passwords
  }

  /**
   * Validate password strength (for manual password entry)
   */
  validatePasswordStrength(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < 12) {
      feedback.push('Password must be at least 12 characters long')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter')
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter')
    } else {
      score += 1
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      feedback.push('Password must contain at least one special character')
    } else {
      score += 1
    }

    return {
      isValid: score === 5,
      score,
      feedback
    }
  }
}

// Export singleton instance
export const securePasswordResetService = SecurePasswordResetService.getInstance()