import { describe, it, expect, beforeEach } from 'vitest'
import { getRolePermissions, hasPermission, getUserRole } from '../../utils/roleUtils'
import type { User } from '../../services/userService'

describe('roleUtils', () => {
  describe('getUserRole', () => {
    it('should extract role from string format', () => {
      const user = { role: 'admin' } as User
      expect(getUserRole(user)).toBe('admin')
    })

    it('should extract role from object format', () => {
      const user = { role: { name: 'manager' } } as User
      expect(getUserRole(user)).toBe('manager')
    })

    it('should handle null/undefined role', () => {
      const user = { role: null } as User
      expect(getUserRole(user)).toBe('user')
    })

    it('should handle empty role object', () => {
      const user = { role: {} } as User
      expect(getUserRole(user)).toBe('user')
    })
  })

  describe('getRolePermissions', () => {
    it('should return admin permissions for admin role', () => {
      const permissions = getRolePermissions({ role: 'admin' } as User)
      
      expect(permissions.canViewDashboard).toBe(true)
      expect(permissions.canViewUsers).toBe(true)
      expect(permissions.canViewEmployees).toBe(true)
      expect(permissions.canViewCustomers).toBe(true)
      expect(permissions.canViewSystemData).toBe(true)
      expect(permissions.canViewOrders).toBe(true)
      expect(permissions.canViewProduction).toBe(true)
      expect(permissions.canViewManagement).toBe(true)
      expect(permissions.canViewIntegrations).toBe(true)
      expect(permissions.canEdit).toBe(true)
      expect(permissions.canDelete).toBe(true)
    })

    it('should return manager permissions for manager role', () => {
      const permissions = getRolePermissions({ role: 'manager' } as User)
      
      expect(permissions.canViewDashboard).toBe(false)
      expect(permissions.canViewUsers).toBe(false)
      expect(permissions.canViewEmployees).toBe(false)
      expect(permissions.canViewCustomers).toBe(false)
      expect(permissions.canViewSystemData).toBe(false)
      expect(permissions.canViewOrders).toBe(true)
      expect(permissions.canViewProduction).toBe(true)
      expect(permissions.canViewManagement).toBe(true)
      expect(permissions.canViewIntegrations).toBe(false)
      expect(permissions.canEdit).toBe(false)
      expect(permissions.canDelete).toBe(false)
    })

    it('should return user permissions for user role', () => {
      const permissions = getRolePermissions({ role: 'user' } as User)
      
      expect(permissions.canViewDashboard).toBe(false)
      expect(permissions.canViewUsers).toBe(false)
      expect(permissions.canViewEmployees).toBe(false)
      expect(permissions.canViewCustomers).toBe(false)
      expect(permissions.canViewSystemData).toBe(false)
      expect(permissions.canViewOrders).toBe(true)
      expect(permissions.canViewProduction).toBe(true)
      expect(permissions.canViewManagement).toBe(false)
      expect(permissions.canViewIntegrations).toBe(false)
      expect(permissions.canEdit).toBe(false)
      expect(permissions.canDelete).toBe(false)
    })

    it('should return user permissions for unknown role', () => {
      const permissions = getRolePermissions({ role: 'unknown' } as User)
      
      expect(permissions.canViewDashboard).toBe(false)
      expect(permissions.canViewUsers).toBe(false)
      expect(permissions.canViewEmployees).toBe(false)
      expect(permissions.canViewCustomers).toBe(false)
      expect(permissions.canViewSystemData).toBe(false)
      expect(permissions.canViewOrders).toBe(true)
      expect(permissions.canViewProduction).toBe(true)
      expect(permissions.canViewManagement).toBe(false)
      expect(permissions.canViewIntegrations).toBe(false)
      expect(permissions.canEdit).toBe(false)
      expect(permissions.canDelete).toBe(false)
    })
  })

  describe('hasPermission', () => {
    const adminUser = { role: 'admin' } as User
    const managerUser = { role: 'manager' } as User
    const regularUser = { role: 'user' } as User

    it('should return true for admin permissions', () => {
      expect(hasPermission(adminUser, 'canViewDashboard')).toBe(true)
      expect(hasPermission(adminUser, 'canEdit')).toBe(true)
      expect(hasPermission(adminUser, 'canDelete')).toBe(true)
    })

    it('should return false for manager dashboard access', () => {
      expect(hasPermission(managerUser, 'canViewDashboard')).toBe(false)
    })

    it('should return true for manager order access', () => {
      expect(hasPermission(managerUser, 'canViewOrders')).toBe(true)
    })

    it('should return false for user edit/delete permissions', () => {
      expect(hasPermission(regularUser, 'canEdit')).toBe(false)
      expect(hasPermission(regularUser, 'canDelete')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasPermission(null, 'canViewDashboard')).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(hasPermission(undefined, 'canViewDashboard')).toBe(false)
    })
  })
})
