import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '../../services/userService'

// Mock the API client
vi.mock('../../config/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            users: [
              { id: 1, username: 'user1', email: 'user1@example.com' },
              { id: 2, username: 'user2', email: 'user2@example.com' }
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 2,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        }
      }

      const { default: mockApiClient } = await import('../../config/api')
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse)

      const result = await UserService.getAllUsers()

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?')
      expect(result.users).toHaveLength(2)
      expect(result.pagination.totalItems).toBe(2)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockApiClient.get.mockRejectedValue(error)

      await expect(UserService.getAllUsers()).rejects.toThrow('API Error')
    })
  })

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        roleId: 1,
        passwordHash: 'hashedpassword'
      }

      const mockResponse = {
        data: {
          data: {
            id: 3,
            ...userData
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const result = await UserService.createUser(userData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData)
      expect(result.id).toBe(3)
      expect(result.username).toBe('newuser')
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 1
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      }

      const mockResponse = {
        data: {
          data: {
            id: userId,
            ...updateData
          }
        }
      }

      mockApiClient.put.mockResolvedValue(mockResponse)

      const result = await UserService.updateUser(userId, updateData)

      expect(mockApiClient.put).toHaveBeenCalledWith(`/users/${userId}`, updateData)
      expect(result.firstName).toBe('Updated')
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 1

      mockApiClient.delete.mockResolvedValue({})

      await UserService.deleteUser(userId)

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/users/${userId}`)
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 1
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      }

      mockApiClient.put.mockResolvedValue({})

      await UserService.changePassword(userId, passwordData)

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/users/${userId}/change-password`,
        passwordData
      )
    })
  })

  describe('changeUsername', () => {
    it('should change username successfully', async () => {
      const userId = 1
      const usernameData = {
        newUsername: 'newusername'
      }

      const mockResponse = {
        data: {
          data: {
            id: userId,
            username: 'newusername'
          }
        }
      }

      mockApiClient.put.mockResolvedValue(mockResponse)

      const result = await UserService.changeUsername(userId, usernameData)

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/users/${userId}/change-username`,
        usernameData
      )
      expect(result.username).toBe('newusername')
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = 1
      const profileData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '1234567890'
      }

      const mockResponse = {
        data: {
          data: {
            id: userId,
            ...profileData
          }
        }
      }

      mockApiClient.put.mockResolvedValue(mockResponse)

      const result = await UserService.updateProfile(userId, profileData)

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/users/${userId}/profile`,
        profileData
      )
      expect(result.firstName).toBe('Updated')
    })
  })
})
