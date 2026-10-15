import api from './api';
import type {
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
} from '../types/user';

export const userService = {
    // ============================================================
    // READ — Liste des USERs
    // ============================================================
    async getMyUsers(): Promise<UserResponse[]> {
        const response = await api.get<UserResponse[]>('/users');
        return response.data;
    },

    // ============================================================
    // READ — Détail d'un USER
    // ============================================================
    async getMyUserById(id: number): Promise<UserResponse> {
        const response = await api.get<UserResponse>(`/users/${id}`);
        return response.data;
    },

    // ============================================================
    // CREATE — ADMIN crée un USER
    // ============================================================
    async createUser(data: CreateUserRequest): Promise<UserResponse> {
        const response = await api.post<UserResponse>('/users', data);
        return response.data;
    },

    // ============================================================
    // UPDATE — Modifier prénom/nom/password
    // ============================================================
    async updateUser(id: number, data: UpdateUserRequest): Promise<UserResponse> {
        const response = await api.put<UserResponse>(`/users/${id}`, data);
        return response.data;
    },

    // ============================================================
    // TOGGLE ACTIF
    // ============================================================
    async toggleActif(id: number): Promise<UserResponse> {
        const response = await api.patch<UserResponse>(`/users/${id}/toggle-actif`);
        return response.data;
    },

    // ============================================================
    // DELETE — Soft delete
    // ============================================================
    async deleteUser(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};