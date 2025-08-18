'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Settings, Bell, Shield, Database, Mail, Globe } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    appName: 'Office Supplies Management',
    currency: 'USD',
    timezone: 'UTC',
    lowStockAlerts: true,
    requestApprovals: true,
    orderUpdates: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordComplexity: true,
    smtpServer: '',
    fromEmail: ''
  })

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Email connection test successful!')
      console.log('Testing email connection with:', settings.smtpServer, settings.fromEmail)
    } catch (error) {
      alert('Email connection test failed!')
      console.error('Email connection test failed:', error)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert('Settings saved successfully!')
      console.log('Saving settings:', settings)
    } catch (error) {
      alert('Failed to save settings!')
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage application settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Application Name</label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => handleInputChange('appName', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                <select 
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Low Stock Alerts</div>
                  <div className="text-sm text-gray-500">Get notified when items are running low</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Request Approvals</div>
                  <div className="text-sm text-gray-500">Notifications for pending approvals</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Order Updates</div>
                  <div className="text-sm text-gray-500">Updates on purchase order status</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                <input
                  type="number"
                  defaultValue="30"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">Require 2FA for all users</div>
                </div>
                <input type="checkbox" className="h-4 w-4 text-indigo-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Password Complexity</div>
                  <div className="text-sm text-gray-500">Enforce strong password requirements</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded" />
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Server</label>
                <input
                  type="text"
                  value={settings.smtpServer}
                  onChange={(e) => handleInputChange('smtpServer', e.target.value)}
                  placeholder="smtp.example.com"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                  placeholder="noreply@company.com"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button 
                onClick={handleTestConnection}
                disabled={isTestingConnection || !settings.smtpServer || !settings.fromEmail}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Test email connection"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Save all settings"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
