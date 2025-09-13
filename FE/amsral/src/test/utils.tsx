import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AuthProvider } from '../context/AuthContext'

// Mock theme for testing
const theme = createTheme()

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock user data for testing
export const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    roleId: 1,
    role: {
        id: 1,
        name: 'admin',
        description: 'Administrator'
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
}

export const mockManager = {
    id: 2,
    username: 'manager',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    roleId: 2,
    role: {
        id: 2,
        name: 'manager',
        description: 'Manager'
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
}

export const mockRegularUser = {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    roleId: 3,
    role: {
        id: 3,
        name: 'user',
        description: 'Regular User'
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
}

// Mock API responses
export const mockApiResponses = {
    success: {
        success: true,
        data: {}
    },
    error: {
        success: false,
        message: 'Test error message'
    }
}

// Mock localStorage
export const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

// Mock sessionStorage
export const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

// Setup localStorage and sessionStorage mocks
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
})

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }