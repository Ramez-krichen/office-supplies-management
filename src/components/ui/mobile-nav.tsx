'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  User
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavItem[]
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  userRole?: string
}

// Function to get navigation items based on user role
const getNavigationItemsForRole = (userRole: string | undefined): NavItem[] => {
  // Add role-specific dashboard items at the top
  const dashboardItems: NavItem[] = []
  const navigationItems: NavItem[] = []

  switch (userRole) {
    case 'ADMIN':
      // Admin gets full access to all features
      dashboardItems.push(
        { name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'System Dashboard', href: '/dashboard/system', icon: LayoutDashboard },
        { name: 'Department Dashboard', href: '/dashboard/department', icon: LayoutDashboard }
      )
      navigationItems.push(
        {
          name: 'Requests',
          href: '/requests',
          icon: FileText,
          children: [
            { name: 'All Requests', href: '/requests', icon: FileText },
            { name: 'My Requests', href: '/requests?filter=my', icon: FileText },
            { name: 'Pending Approval', href: '/requests?status=pending', icon: FileText }
          ]
        },
        {
          name: 'Inventory',
          href: '/inventory',
          icon: Package,
          children: [
            { name: 'All Items', href: '/inventory', icon: Package },
            { name: 'Low Stock', href: '/inventory?status=low-stock', icon: Package },
            { name: 'Categories', href: '/categories', icon: Package }
          ]
        },
        { name: 'Suppliers', href: '/suppliers', icon: Building2 },
        { name: 'Purchase Orders', href: '/orders', icon: ShoppingCart },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings }
      )
      break
    case 'MANAGER':
      // Manager gets department operations and approvals
      dashboardItems.push(
        { name: 'Personal Dashboard', href: '/dashboard/employee', icon: LayoutDashboard },
        { name: 'Department Dashboard', href: '/dashboard/department', icon: LayoutDashboard }
      )
      navigationItems.push(
        {
          name: 'Requests',
          href: '/requests',
          icon: FileText,
          children: [
            { name: 'All Requests', href: '/requests', icon: FileText },
            { name: 'My Requests', href: '/requests?filter=my', icon: FileText },
            { name: 'Pending Approval', href: '/requests?status=pending', icon: FileText }
          ]
        },
        {
          name: 'Inventory',
          href: '/inventory',
          icon: Package,
          children: [
            { name: 'All Items', href: '/inventory', icon: Package },
            { name: 'Low Stock', href: '/inventory?status=low-stock', icon: Package }
          ]
        },
        { name: 'Reports', href: '/reports', icon: BarChart3 }
      )
      break
    case 'EMPLOYEE':
      // Employee gets very limited access - focused on their own requests and inventory info
      dashboardItems.push(
        { name: 'Personal Dashboard', href: '/dashboard/employee', icon: LayoutDashboard }
      )
      navigationItems.push(
        {
          name: 'Requests',
          href: '/requests',
          icon: FileText,
          children: [
            { name: 'My Requests', href: '/requests?filter=my', icon: FileText }
          ]
        },
        {
          name: 'Inventory',
          href: '/inventory',
          icon: Package,
          children: [
            { name: 'All Items', href: '/inventory', icon: Package }
          ]
        },
        { name: 'Reports', href: '/reports', icon: BarChart3 }
      )
      break
    default:
      dashboardItems.push(
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      )
      navigationItems.push(
        { name: 'Requests', href: '/requests', icon: FileText },
        { name: 'Inventory', href: '/inventory', icon: Package }
      )
  }

  return [...dashboardItems, ...navigationItems]
}

export function MobileNav({ isOpen, onClose, userRole }: MobileNavProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const navigationItems = getNavigationItemsForRole(userRole)

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const hasAccess = (item: NavItem) => {
    // Admin can access everything
    if (userRole === 'ADMIN') return true

    // Managers can access most things except user management
    if (userRole === 'MANAGER') {
      return item.name !== 'Users'
    }

    // Employees have limited access
    if (userRole === 'EMPLOYEE') {
      return !['Users', 'Settings'].includes(item.name)
    }

    return true
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Navigation Panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navigationItems
              .filter(hasAccess)
              .map((item) => {
                const isItemActive = isActive(item.href)
                const isExpanded = expandedItems.has(item.name)
                const hasChildren = item.children && item.children.length > 0

                return (
                  <div key={item.name}>
                    {/* Main Item */}
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={hasChildren ? undefined : onClose}
                        className={`
                          flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${isItemActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <item.icon className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isItemActive ? 'text-blue-700' : 'text-gray-400'}
                        `} />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      
                      {/* Expand/Collapse Button */}
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <ChevronRight className={`
                            h-4 w-4 transition-transform duration-200
                            ${isExpanded ? 'rotate-90' : ''}
                          `} />
                        </button>
                      )}
                    </div>

                    {/* Children Items */}
                    {hasChildren && isExpanded && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children!.map((child) => {
                          const isChildActive = isActive(child.href)
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={onClose}
                              className={`
                                flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                                ${isChildActive 
                                  ? 'bg-blue-50 text-blue-700 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                            >
                              <child.icon className={`
                                mr-3 h-4 w-4 flex-shrink-0
                                ${isChildActive ? 'text-blue-700' : 'text-gray-400'}
                              `} />
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 text-center">
            Office Supplies Management
          </div>
        </div>
      </div>
    </>
  )
}

// Mobile Bottom Navigation for quick access
interface BottomNavProps {
  className?: string
}

export function MobileBottomNav({ className = '' }: BottomNavProps) {
  const pathname = usePathname()

  const quickNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Requests', href: '/requests', icon: FileText },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Profile', href: '/profile', icon: User }
  ]

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden ${className}`}>
      <div className="grid grid-cols-5">
        {quickNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href) || (item.href === '/dashboard' && pathname === item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors
                ${isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Touch-friendly button component
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function TouchButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '' 
}: TouchButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}
