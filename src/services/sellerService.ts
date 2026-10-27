import api from './api';
import type { CreateSellerRequest } from '../types/seller';
import type { UserResponse } from '../types/user';

export const sellerService = {
    // ============================================================
    // CREATE
    // ============================================================
    async createSeller(data: CreateSellerRequest): Promise<UserResponse> {
        const response = await api.post<UserResponse>('/sellers', data);
        return response.data;
    },

    // ============================================================
    // READ
    // ============================================================
    async getMySellers(): Promise<UserResponse[]> {
        const response = await api.get<UserResponse[]>('/sellers');
        return response.data;
    },

    async getMySellerById(id: number): Promise<UserResponse> {
        const response = await api.get<UserResponse>(`/sellers/${id}`);
        return response.data;
    },

    // ============================================================
    // UPDATE (Activer / Désactiver)
    // ============================================================
    async toggleSellerActif(id: number): Promise<UserResponse> {
        const response = await api.patch<UserResponse>(`/sellers/${id}/toggle-actif`);
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deleteSeller(id: number): Promise<void> {
        await api.delete(`/sellers/${id}`);
    },
};