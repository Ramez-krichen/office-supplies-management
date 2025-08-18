'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { canAccessFeature, getUserAccessConfig } from '@/lib/access-control'
import { useUserPermissions, hasPermission } from '@/hooks/useUserPermissions'
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Building,
  Activity,
  Zap,
  Menu,
  X,
  User
} from 'lucide-react'

// Function to get navigation items based on user role using enhanced access control
const getNavigationForRole = (userRole: string | undefined, userPermissions: string[] = []) => {
  if (!userRole) return []

  const accessConfig = getUserAccessConfig(userRole)
  if (!accessConfig) return []

  // Add role-specific dashboard items at the top
  const dashboardItems = []
  const navigationItems = []

  // Dashboard access based on configuration
  if (accessConfig.dashboards.adminDashboard) {
    dashboardItems.push({ name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard })
  }
  if (accessConfig.dashboards.systemDashboard) {
    dashboardItems.push({ name: 'System Dashboard', href: '/dashboard/system', icon: LayoutDashboard })
  }
  if (accessConfig.dashboards.departmentDashboard) {
    dashboardItems.push({ name: 'Department Dashboard', href: '/dashboard/department', icon: LayoutDashboard })
  }
  if (accessConfig.dashboards.personalDashboard) {
    dashboardItems.push({ name: 'Personal Dashboard', href: '/dashboard/employee', icon: LayoutDashboard })
  }

  // Feature access based on configuration
  if (accessConfig.requests.canView) {
    navigationItems.push({ name: 'Requests', href: '/requests', icon: FileText })
  }
  if (accessConfig.inventory.canView) {
    navigationItems.push({ name: 'Inventory', href: '/inventory', icon: Package })
  }
  if (accessConfig.suppliers.canView) {
    navigationItems.push({ name: 'Suppliers', href: '/suppliers', icon: Building2 })
  }
  // Purchase Orders - check for explicit permissions for managers
  if (accessConfig.purchaseOrders.canView) {
    // For managers, check if they have explicit permission
    if (userRole === 'MANAGER') {
      if (hasPermission(userPermissions, 'purchase_orders')) {
        navigationItems.push({ name: 'Purchase Orders', href: '/orders', icon: ShoppingCart })
      }
    } else {
      // For admins, always show
      navigationItems.push({ name: 'Purchase Orders', href: '/orders', icon: ShoppingCart })
    }
  }
  if (accessConfig.reports.canView) {
    navigationItems.push({ name: 'Reports', href: '/reports', icon: BarChart3 })
  }
  if (accessConfig.quickReports.canView) {
    navigationItems.push({ name: 'Quick Reports', href: '/quick-reports', icon: Zap })
  }
  if (accessConfig.users.canView) {
    navigationItems.push({ name: 'Users', href: '/users', icon: Users })
  }
  if (accessConfig.departments.canView) {
    navigationItems.push({ name: 'Departments', href: '/departments', icon: Building })
  }
  if (accessConfig.auditLogs.canView) {
    navigationItems.push({ name: 'Audit Logs', href: '/audit-logs', icon: Activity })
  }
  if (accessConfig.settings.canView) {
    navigationItems.push({ name: 'Settings', href: '/settings', icon: Settings })
  }

  return [...dashboardItems, ...navigationItems]
}

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { permissions } = useUserPermissions()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 transition-all duration-300 ease-in-out lg:static lg:z-auto",
        // Mobile styles
        isMobileOpen ? "w-64" : "-translate-x-full lg:translate-x-0",
        // Desktop styles
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <div className="flex h-16 items-center justify-between bg-gray-800 px-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white truncate">Office Supplies</h1>
          )}
          
          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
          
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {getNavigationForRole(session?.user?.role, permissions).map((item) => {
            // Skip items that require a specific role if user doesn't have it
            if (item.requiredRole && session?.user?.role !== item.requiredRole) {
              return null
            }
            
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  isCollapsed ? 'justify-center' : ''
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                    isCollapsed ? '' : 'mr-3'
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : ""
          )}>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Link
                href="/profile"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 hover:text-white",
                  pathname === '/profile' ? "bg-gray-700 text-white" : ""
                )}
                title="My Profile"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                onClick={handleSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
