import api from './api';
import type {
    AuthResponse,
    LoginRequest,
    RegisterAdminRequest,
    UpdateProfileRequest,
    ChangePasswordDTO,
} from '../types/auth';

export const authService = {
    // ============================================================
    // Login
    // ============================================================
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    // ============================================================
    // Register ADMIN + Entreprise
    // ============================================================
    async registerAdmin(data: RegisterAdminRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register-admin', data);
        return response.data;
    },

    // ============================================================
    // Update Profile
    // ============================================================
    async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
        const response = await api.put<AuthResponse>('/auth/profile', data);
        return response.data;
    },

    // ============================================================
    // Change Password
    // ============================================================
    async changePassword(data: ChangePasswordDTO): Promise<void> {
        await api.post('/auth/change-password', data);
    },
};