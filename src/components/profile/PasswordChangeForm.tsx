'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

interface PasswordChangeFormProps {
  formData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  errors: Record<string, string>
  onInputChange: (field: string, value: string) => void
  isVisible: boolean
  onToggleVisibility: () => void
}

export function PasswordChangeForm({ 
  formData, 
  errors, 
  onInputChange, 
  isVisible, 
  onToggleVisibility 
}: PasswordChangeFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Lock className="h-5 w-5 text-gray-400 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Change Password</h4>
        </div>
        <button
          onClick={onToggleVisibility}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isVisible ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                For security, you must enter your current password to change it.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => onInputChange('currentPassword', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => onInputChange('newPassword', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Password Security Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use a combination of letters, numbers, and symbols</li>
                  <li>Avoid using personal information</li>
                  <li>Don't reuse passwords from other accounts</li>
                  <li>Consider using a password manager</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
