import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { mockUser } from '../utils'

// Mock the auth service
vi.mock('../../services/authService', () => ({
    default: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        isAuthenticated: vi.fn(),
    },
    AuthService: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        isAuthenticated: vi.fn(),
    }
}))

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
})

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLocalStorage.getItem.mockReturnValue(null)
    })

    it('should provide initial auth state', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.user).toBe(null)
        expect(result.current.loading).toBe(false)
        expect(typeof result.current.login).toBe('function')
        expect(typeof result.current.logout).toBe('function')
        expect(typeof result.current.updateUser).toBe('function')
    })

    it('should handle login with valid credentials', async () => {
        const mockLoginResponse = {
            success: true,
            message: 'Login successful',
            user: mockUser,
            token: 'mock-token'
        }

        const { AuthService } = await import('../../services/authService')
        vi.mocked(AuthService.login).mockResolvedValue(mockLoginResponse)

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        await act(async () => {
            await result.current.login('test@example.com', 'password')
        })

        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user).toEqual(mockUser)
    })

    it('should handle login failure', async () => {
        const mockLoginResponse = {
            success: false,
            message: 'Invalid credentials'
        }

        const { AuthService } = await import('../../services/authService')
        vi.mocked(AuthService.login).mockResolvedValue(mockLoginResponse)

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        await act(async () => {
            await result.current.login('test@example.com', 'wrongpassword')
        })

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.user).toBe(null)
    })

    it('should handle logout', async () => {
        const { AuthService } = await import('../../services/authService')
        vi.mocked(AuthService.logout).mockResolvedValue(undefined)

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        // First set a user
        act(() => {
            result.current.updateUser(mockUser)
        })

        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user).toEqual(mockUser)

        // Then logout
        await act(async () => {
            await result.current.logout()
        })

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.user).toBe(null)
    })

    it('should update user data', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        act(() => {
            result.current.updateUser(mockUser)
        })

        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
    })

    it('should restore user from localStorage on mount', async () => {
        const { AuthService } = await import('../../services/authService')

        vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
        vi.mocked(AuthService.isAuthenticated).mockReturnValue(true)

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        // Wait for useEffect to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle invalid localStorage data', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json')

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        expect(result.current.user).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
    })
})
