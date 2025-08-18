'use client'

import { User, Mail, Shield, Building } from 'lucide-react'

interface PersonalInfoFormProps {
  formData: {
    name: string
    email: string
    role: string
    department: string
  }
  errors: Record<string, string>
  isEditing: boolean
  onInputChange: (field: string, value: string) => void
}

export function PersonalInfoForm({ 
  formData, 
  errors, 
  isEditing, 
  onInputChange 
}: PersonalInfoFormProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <User className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="h-4 w-4 inline mr-1" />
            Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {formData.name || 'Not provided'}
            </p>
          )}
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="h-4 w-4 inline mr-1" />
            Email Address
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
          ) : (
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {formData.email || 'Not provided'}
            </p>
          )}
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Shield className="h-4 w-4 inline mr-1" />
            Role
          </label>
          <div className="flex items-center">
            <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-md ${
              formData.role === 'ADMIN' 
                ? 'bg-purple-100 text-purple-800' 
                : formData.role === 'MANAGER'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {formData.role || 'Not assigned'}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              (Role cannot be changed)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building className="h-4 w-4 inline mr-1" />
            Department
          </label>
          <div className="flex items-center">
            <span className="inline-flex px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md">
              {formData.department || 'Not assigned'}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              (Contact admin to change department)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
