'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Copy, Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  department: string | null
  status: string
}

interface SecurePasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess?: () => void
}

interface PasswordResetResult {
  success: boolean
  newPassword?: string
  auditLogId?: string
  securityNotice?: string
  error?: string
}

export default function SecurePasswordResetModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: SecurePasswordResetModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [notifyUser, setNotifyUser] = useState(true)
  const [resetResult, setResetResult] = useState<PasswordResetResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const handleReset = () => {
    setResetResult(null)
    setReason('')
    setNotifyUser(true)
    setShowPassword(false)
    setPasswordCopied(false)
    setConfirmReset(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setPasswordCopied(true)
      showSuccessToast('Password copied to clipboard')
      setTimeout(() => setPasswordCopied(false), 3000)
    } catch {
      showErrorToast('Failed to copy password')
    }
  }

  const performPasswordReset = async () => {
    if (!user || !confirmReset) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/secure-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.trim() || 'Administrative password reset',
          notifyUser
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setResetResult(data)
      showSuccessToast('Password reset successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Password reset error:', error)
      setResetResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      })
      showErrorToast('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🔒 Secure Password Reset"
      size="lg"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-6">
        {/* User Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            Target User
          </h3>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role === 'ADMIN' ? 'Administrator' : 
               user.role === 'GENERAL_MANAGER' ? 'General Manager' :
               user.role === 'MANAGER' ? 'Manager' : 'Employee'}
            </span></p>
            <p><strong>Department:</strong> {user.department || 'N/A'}</p>
            <p><strong>Status:</strong> <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.status}</span></p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
              <p className="text-sm text-yellow-700 mb-2">This action will:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>Generate a new cryptographically secure password</li>
                <li>Invalidate all existing sessions for this user</li>
                <li>Create a comprehensive audit log entry</li>
                <li>Send a security notification to the user (if enabled)</li>
                <li>Display the new password only once</li>
              </ul>
            </div>
          </div>
        </div>

        {!resetResult && (
          <>
            {/* Reset Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Password Reset
                </label>
                <textarea
                  id="reason"
                  placeholder="Enter the reason for this password reset (optional but recommended for audit purposes)"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyUser"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyUser" className="text-sm text-gray-700">
                  Send security notification to user
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirmReset"
                  checked={confirmReset}
                  onChange={(e) => setConfirmReset(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="confirmReset" className="text-sm text-red-600 font-medium">
                  I confirm that I want to reset this user&apos;s password
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={performPasswordReset}
                disabled={!confirmReset || isLoading}
                loading={isLoading}
                loadingText="Resetting..."
              >
                Reset Password
              </Button>
            </div>
          </>
        )}

        {/* Reset Result */}
        {resetResult && (
          <div className="space-y-4">
            {resetResult.success ? (
              <>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 mb-1">Password Reset Successful</h4>
                      <p className="text-sm text-green-700">
                        Password reset completed successfully. The user&apos;s sessions have been invalidated and they will need to sign in with the new password.
                      </p>
                    </div>
                  </div>
                </div>

                {resetResult.newPassword && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-yellow-800">New Password</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Display Once Only
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={resetResult.newPassword}
                        readOnly
                        className="flex-1 px-3 py-2 font-mono text-sm bg-white border border-yellow-300 rounded-md focus:outline-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(resetResult.newPassword!)}
                        disabled={passwordCopied}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {passwordCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> Save this password securely. It will not be displayed again and cannot be retrieved.
                    </p>
                  </div>
                )}

                {resetResult.auditLogId && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <strong>Audit Log ID:</strong> <code className="font-mono">{resetResult.auditLogId}</code>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">Error</h4>
                    <p className="text-sm text-red-700">{resetResult.error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              {resetResult.success && (
                <Button variant="outline" onClick={handleReset}>
                  Reset Another Password
                </Button>
              )}
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}