import bcrypt from 'bcryptjs'
import { db } from './db'

export interface ProfileUpdateData {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export interface SecurityValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates profile update data for security compliance
 */
export async function validateProfileUpdate(
  userId: string,
  updateData: ProfileUpdateData
): Promise<SecurityValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Get current user data
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      password: true,
      updatedAt: true
    }
  })

  if (!currentUser) {
    errors.push('User not found')
    return { isValid: false, errors, warnings }
  }

  // Validate name
  if (updateData.name !== undefined) {
    if (!updateData.name.trim()) {
      errors.push('Name cannot be empty')
    } else if (updateData.name.length < 2) {
      errors.push('Name must be at least 2 characters long')
    } else if (updateData.name.length > 100) {
      errors.push('Name cannot exceed 100 characters')
    }
  }

  // Validate email
  if (updateData.email !== undefined) {
    if (!updateData.email.trim()) {
      errors.push('Email cannot be empty')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
      errors.push('Invalid email format')
    } else if (updateData.email !== currentUser.email) {
      // Check if email is already taken
      const existingUser = await db.user.findUnique({
        where: { email: updateData.email },
        select: { id: true }
      })
      
      if (existingUser && existingUser.id !== userId) {
        errors.push('Email is already in use by another account')
      }
      
      warnings.push('Email change will require re-authentication')
    }
  }

  // Validate password change
  if (updateData.newPassword !== undefined) {
    if (!updateData.currentPassword) {
      errors.push('Current password is required to change password')
    } else {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        updateData.currentPassword,
        currentUser.password
      )
      
      if (!isCurrentPasswordValid) {
        errors.push('Current password is incorrect')
      }
    }

    // Validate new password strength
    if (updateData.newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long')
    } else if (updateData.newPassword.length > 128) {
      errors.push('New password cannot exceed 128 characters')
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'password123', 'admin', 'user']
    if (weakPasswords.includes(updateData.newPassword.toLowerCase())) {
      errors.push('Password is too common and insecure')
    }

    // Check if new password is same as current
    if (updateData.currentPassword && updateData.newPassword === updateData.currentPassword) {
      warnings.push('New password is the same as current password')
    }
  }

  // Rate limiting check - prevent too frequent updates
  const lastUpdate = new Date(currentUser.updatedAt)
  const timeSinceLastUpdate = Date.now() - lastUpdate.getTime()
  const minUpdateInterval = 5 * 60 * 1000 // 5 minutes

  if (timeSinceLastUpdate < minUpdateInterval) {
    warnings.push('Profile was recently updated. Consider waiting before making more changes.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}



/**
 * Checks if user session should be invalidated after profile changes
 */
export function shouldInvalidateSession(updateData: ProfileUpdateData): boolean {
  // Invalidate session if email or password changed
  return !!(updateData.email || updateData.newPassword)
}

/**
 * Generates a secure password hash
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Include numbers')
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include special characters')
  }

  return { score, feedback }
}
