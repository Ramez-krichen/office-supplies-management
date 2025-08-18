'use client'

import { Shield, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AccountStatusCardProps {
  profile: {
    status: string
    lastSignIn?: string
    createdAt: string
    updatedAt: string
    role: string
  }
}

export function AccountStatusCard({ profile }: AccountStatusCardProps) {
  const getStatusIcon = () => {
    return profile.status === 'ACTIVE' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusColor = () => {
    return profile.status === 'ACTIVE' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getRoleColor = () => {
    switch (profile.role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor()}`}>
                {profile.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {profile.status === 'ACTIVE' 
                ? 'Your account is active and you have full access to the system.'
                : 'Your account is inactive. Contact your administrator for assistance.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor()}`}>
                {profile.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your role determines your permissions and access level in the system.
            </p>
          </div>

          {profile.lastSignIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Sign In</label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {new Date(profile.lastSignIn).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Keep track of your account activity for security.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The date when your account was created.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">
                {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The last time your profile information was modified.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Security Notice</h4>
            <p className="text-sm text-blue-800">
              Keep your profile information up to date and change your password regularly. 
              If you notice any suspicious activity, contact your system administrator immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
