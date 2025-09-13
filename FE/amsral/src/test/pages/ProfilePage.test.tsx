import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilePage from '../../pages/ProfilePage'
import { mockUser } from '../utils'

// Mock the auth hook
const mockUseAuth = {
    user: mockUser,
    updateUser: vi.fn(),
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
}

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => mockUseAuth
}))

// Mock the user service
vi.mock('../../services/userService', () => ({
    UserService: {
        updateProfile: vi.fn(),
        changePassword: vi.fn(),
        changeUsername: vi.fn(),
    }
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}))

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render profile page with user data', () => {
        render(<ProfilePage />)

        expect(screen.getByText('Profile Settings')).toBeInTheDocument()
        expect(screen.getByText('Profile Information')).toBeInTheDocument()
        expect(screen.getByText('Change Password')).toBeInTheDocument()
        expect(screen.getByText('Change Username')).toBeInTheDocument()
    })

    it('should display user information in profile form', () => {
        render(<ProfilePage />)

        expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
        expect(screen.getByDisplayValue('User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    })

    it('should switch between tabs', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)

        // Click on Change Password tab
        await user.click(screen.getByText('Change Password'))
        expect(screen.getByText('Current Password')).toBeInTheDocument()

        // Click on Change Username tab
        await user.click(screen.getByText('Change Username'))
        expect(screen.getByText('New Username')).toBeInTheDocument()

        // Click back to Profile Information tab
        await user.click(screen.getByText('Profile Information'))
        expect(screen.getByText('First Name')).toBeInTheDocument()
    })

    it('should update profile information', async () => {
        const user = userEvent.setup()
        const { UserService } = await import('../../services/userService')

        vi.mocked(UserService.updateProfile).mockResolvedValue({
            ...mockUser,
            firstName: 'Updated',
            lastName: 'Name'
        })

        render(<ProfilePage />)

        // Update first name
        const firstNameInput = screen.getByDisplayValue('Test')
        await user.clear(firstNameInput)
        await user.type(firstNameInput, 'Updated')

        // Submit form
        await user.click(screen.getByText('Update Profile'))

        await waitFor(() => {
            expect(UserService.updateProfile).toHaveBeenCalledWith(1, {
                firstName: 'Updated',
                lastName: 'User',
                phone: '1234567890',
                dateOfBirth: '1990-01-01'
            })
        })
    })

    it('should validate profile form', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)

        // Clear required fields
        const firstNameInput = screen.getByDisplayValue('Test')
        await user.clear(firstNameInput)

        // Submit form
        await user.click(screen.getByText('Update Profile'))

        expect(screen.getByText('First name is required')).toBeInTheDocument()
    })

    it('should change password', async () => {
        const user = userEvent.setup()
        const { UserService } = await import('../../services/userService')

        vi.mocked(UserService.changePassword).mockResolvedValue(undefined)

        render(<ProfilePage />)

        // Switch to password tab
        await user.click(screen.getByText('Change Password'))

        // Fill password form
        await user.type(screen.getByLabelText('Current Password'), 'oldpassword')
        await user.type(screen.getByLabelText('New Password'), 'newpassword')
        await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword')

        // Submit form
        await user.click(screen.getByText('Change Password'))

        await waitFor(() => {
            expect(UserService.changePassword).toHaveBeenCalledWith(1, {
                currentPassword: 'oldpassword',
                newPassword: 'newpassword'
            })
        })
    })

    it('should validate password form', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)

        // Switch to password tab
        await user.click(screen.getByText('Change Password'))

        // Submit form without filling
        await user.click(screen.getByText('Change Password'))

        expect(screen.getByText('Current password is required')).toBeInTheDocument()
        expect(screen.getByText('New password is required')).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)

        // Switch to password tab
        await user.click(screen.getByText('Change Password'))

        // Fill with mismatched passwords
        await user.type(screen.getByLabelText('Current Password'), 'oldpassword')
        await user.type(screen.getByLabelText('New Password'), 'newpassword')
        await user.type(screen.getByLabelText('Confirm New Password'), 'differentpassword')

        // Submit form
        await user.click(screen.getByText('Change Password'))

        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('should change username', async () => {
        const user = userEvent.setup()
        const { UserService } = await import('../../services/userService')

        vi.mocked(UserService.changeUsername).mockResolvedValue({
            ...mockUser,
            username: 'newusername'
        })

        render(<ProfilePage />)

        // Switch to username tab
        await user.click(screen.getByText('Change Username'))

        // Update username
        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'newusername')

        // Submit form
        await user.click(screen.getByText('Change Username'))

        // Confirm in dialog
        await user.click(screen.getByText('Confirm'))

        await waitFor(() => {
            expect(UserService.changeUsername).toHaveBeenCalledWith(1, {
                newUsername: 'newusername'
            })
        })
    })

    it('should validate username form', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)

        // Switch to username tab
        await user.click(screen.getByText('Change Username'))

        // Clear username
        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)

        // Submit form
        await user.click(screen.getByText('Change Username'))

        expect(screen.getByText('Username is required')).toBeInTheDocument()
    })

    it('should show loading state during form submission', async () => {
        const user = userEvent.setup()
        const { UserService } = await import('../../services/userService')

        // Mock a delayed response
        vi.mocked(UserService.updateProfile).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
        )

        render(<ProfilePage />)

        // Submit form
        await user.click(screen.getByText('Update Profile'))

        // Should show loading state
        expect(screen.getByRole('button', { name: 'Update Profile' })).toBeDisabled()
    })

    it('should show loading spinner when no user data', () => {
        // Mock no user
        vi.mocked(mockUseAuth).user = null

        render(<ProfilePage />)

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
})
