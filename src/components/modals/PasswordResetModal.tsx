'use client'

import { useState } from 'react'
import { Modal } from '../ui/modal'
import { Input } from '../ui/form'
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  user: User | null
}

export function PasswordResetModal({ isOpen, onClose, onSuccess, user }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long'
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm the new password'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    setIsSubmitting(true)
    try {
      if (!validateForm()) {
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: newPassword.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset password')
      }

      await response.json()
      onSuccess(`Password reset successfully for ${user.name}. The user will need to use the new password on their next login.`)
      handleClose()
    } catch (error) {
      console.error('Error resetting password:', error)
      if (error instanceof Error) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: 'Failed to reset password. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'newPassword') {
      setNewPassword(value)
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value)
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset User Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Security Notice:</strong> You are about to reset the password for{' '}
                <strong>{user.name}</strong> ({user.email}). The old password will be permanently replaced and cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Resetting password for:</h4>
          <div className="text-sm text-gray-700">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        {/* New Password Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Enter new password (minimum 6 characters)"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-600">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm the new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-blue-900 mb-1">Password Requirements:</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Minimum 6 characters long</li>
            <li>• User will be required to use this new password on their next login</li>
            <li>• Consider informing the user about the password change through other means</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Resetting...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}