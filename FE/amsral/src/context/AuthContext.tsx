import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthService from '../services/authService';
import type { User } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already authenticated on app start
        const currentUser = AuthService.getCurrentUser();
        const isAuth = AuthService.isAuthenticated();

        if (isAuth && currentUser) {
            setUser(currentUser);
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            console.log('AuthContext: Starting login process'); // Debug log
            const response = await AuthService.login({ email, password });
            console.log('AuthContext: Login successful, setting user'); // Debug log
            setUser(response.user);
        } catch (error) {
            console.error('AuthContext: Login error:', error); // Debug log
            // Always re-throw to allow LoginPage to handle it
            throw error;
        } finally {
            console.log('AuthContext: Setting loading to false'); // Debug log
            setLoading(false);
        }
    };

    const logout = (): void => {
        setUser(null);
        AuthService.logout();
    };

    const updateUser = (newUser: User): void => {
        setUser(newUser);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
