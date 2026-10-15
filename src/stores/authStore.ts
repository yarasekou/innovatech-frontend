import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, CurrentUser } from '../types/auth';

interface AuthState {
    token: string | null;
    user: CurrentUser | null;
    isAuthenticated: boolean;

    login: (authResponse: AuthResponse) => void;
    logout: () => void;
    updateUser: (user: CurrentUser, token?: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            login: (authResponse: AuthResponse) => {
                set({
                    token: authResponse.token,
                    user: {
                        email: authResponse.email,
                        username: authResponse.username,
                        roles: authResponse.roles,
                    },
                    isAuthenticated: true,
                });
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            updateUser: (user, token) => {
                set((state) => ({
                    user,
                    token: token || state.token,
                }));
            },
        }),
        {
            name: 'innovatech-auth',
        }
    )
);