import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import { mockUser, mockManager, mockRegularUser } from '../utils'

// Mock the auth hook
const mockUseAuth = {
    user: null,
    updateUser: vi.fn(),
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
}

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => mockUseAuth
}))

// Mock the auth service
vi.mock('../../services/authService', () => ({
    AuthService: {
        login: vi.fn(),
    }
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

const renderWithRouter = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    )
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.user = null
        mockUseAuth.isAuthenticated = false
    })

    it('should render login form', () => {
        renderWithRouter(<LoginPage />)

        expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('should handle form input', async () => {
        const user = userEvent.setup()
        renderWithRouter(<LoginPage />)

        const emailInput = screen.getByLabelText('Email')
        const passwordInput = screen.getByLabelText('Password')

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')

        expect(emailInput).toHaveValue('test@example.com')
        expect(passwordInput).toHaveValue('password123')
    })

    it('should validate required fields', async () => {
        const user = userEvent.setup()
        renderWithRouter(<LoginPage />)

        // Submit form without filling
        await user.click(screen.getByRole('button', { name: 'Login' }))

        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should validate email format', async () => {
        const user = userEvent.setup()
        renderWithRouter(<LoginPage />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, 'invalid-email')
        await user.click(screen.getByRole('button', { name: 'Login' }))

        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    it('should handle successful login', async () => {
        const user = userEvent.setup()
        const { AuthService } = await import('../../services/authService')

        vi.mocked(AuthService.login).mockResolvedValue({
            success: true,
            data: {
                user: mockUser,
                token: 'mock-token'
            }
        })

        renderWithRouter(<LoginPage />)

        // Fill form
        await user.type(screen.getByLabelText('Email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')

        // Submit form
        await user.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password123')
        })
    })

    it('should handle login error', async () => {
        const user = userEvent.setup()
        const { AuthService } = await import('../../services/authService')

        vi.mocked(AuthService.login).mockResolvedValue({
            success: false,
            message: 'Invalid credentials'
        })

        renderWithRouter(<LoginPage />)

        // Fill form
        await user.type(screen.getByLabelText('Email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'wrongpassword')

        // Submit form
        await user.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })

    it('should show loading state during login', async () => {
        const user = userEvent.setup()
        const { login } = await import('../../services/authService')

        // Mock a delayed response
        vi.mocked(login).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: { user: mockUser, token: 'token' } }), 100))
        )

        renderWithRouter(<LoginPage />)

        // Fill form
        await user.type(screen.getByLabelText('Email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')

        // Submit form
        await user.click(screen.getByRole('button', { name: 'Login' }))

        // Should show loading state
        expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
    })

    it('should redirect admin to dashboard after login', async () => {
        mockUseAuth.user = mockUser
        mockUseAuth.isAuthenticated = true

        renderWithRouter(<LoginPage />)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('should redirect manager to management after login', async () => {
        mockUseAuth.user = mockManager
        mockUseAuth.isAuthenticated = true

        renderWithRouter(<LoginPage />)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/management')
        })
    })

    it('should redirect user to orders after login', async () => {
        mockUseAuth.user = mockRegularUser
        mockUseAuth.isAuthenticated = true

        renderWithRouter(<LoginPage />)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/orders')
        })
    })

    it('should handle role as object with name property', async () => {
        const userWithObjectRole = {
            ...mockUser,
            role: { name: 'admin' }
        }

        mockUseAuth.user = userWithObjectRole
        mockUseAuth.isAuthenticated = true

        renderWithRouter(<LoginPage />)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('should redirect to orders for unknown role', async () => {
        const userWithUnknownRole = {
            ...mockUser,
            role: 'unknown'
        }

        mockUseAuth.user = userWithUnknownRole
        mockUseAuth.isAuthenticated = true

        renderWithRouter(<LoginPage />)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/orders')
        })
    })
})
