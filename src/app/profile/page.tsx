'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { User, Mail, Shield, Calendar, Save, Eye, EyeOff, Lock } from 'lucide-react'
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'
import { AccountStatusCard } from '@/components/profile/AccountStatusCard'
import { ProfileActivity } from '@/components/profile/ProfileActivity'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: string
  lastSignIn?: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password'
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters long'
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setIsEditing(false)
      setShowPasswordSection(false)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
    setIsEditing(false)
    setShowPasswordSection(false)
    setErrors({})
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading profile...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load profile</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account information and settings</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <User className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoForm
              formData={{
                name: formData.name,
                email: formData.email,
                role: profile.role,
                department: profile.department || ''
              }}
              errors={errors}
              isEditing={isEditing}
              onInputChange={handleInputChange}
            />

            {/* Password Change Section */}
            {isEditing && (
              <div className="bg-white shadow rounded-lg p-6">
                <PasswordChangeForm
                  formData={{
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                  }}
                  errors={errors}
                  onInputChange={handleInputChange}
                  isVisible={showPasswordSection}
                  onToggleVisibility={() => setShowPasswordSection(!showPasswordSection)}
                />
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account Information and Activity */}
          <div className="space-y-6">
            <AccountStatusCard profile={profile} />
            <ProfileActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
