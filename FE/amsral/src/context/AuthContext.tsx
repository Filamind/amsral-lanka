import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthService from '../services/authService';
import type { User } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
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
            const response = await AuthService.login({ email, password });
            setUser(response.user);
        } finally {
            setLoading(false);
        }
    };

    const logout = (): void => {
        setUser(null);
        AuthService.logout();
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
