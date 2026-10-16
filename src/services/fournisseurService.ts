import api from './api';
import type { FournisseurRequest, FournisseurResponse } from '../types/fournisseur';

export const fournisseurService = {
    // ============================================================
    // READ
    // ============================================================
    async getFournisseurs(): Promise<FournisseurResponse[]> {
        const response = await api.get<FournisseurResponse[]>('/fournisseurs');
        return response.data;
    },

    async getFournisseursActifs(): Promise<FournisseurResponse[]> {
        const response = await api.get<FournisseurResponse[]>('/fournisseurs/actifs');
        return response.data;
    },

    async getFournisseurById(id: number): Promise<FournisseurResponse> {
        const response = await api.get<FournisseurResponse>(`/fournisseurs/${id}`);
        return response.data;
    },

    async getByCode(code: string): Promise<FournisseurResponse> {
        const response = await api.get<FournisseurResponse>(`/fournisseurs/code/${code}`);
        return response.data;
    },

    async searchFournisseurs(query: string): Promise<FournisseurResponse[]> {
        const response = await api.get<FournisseurResponse[]>('/fournisseurs/search', {
            params: { q: query },
        });
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createFournisseur(data: FournisseurRequest): Promise<FournisseurResponse> {
        const response = await api.post<FournisseurResponse>('/fournisseurs', data);
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async updateFournisseur(
        id: number,
        data: FournisseurRequest
    ): Promise<FournisseurResponse> {
        const response = await api.put<FournisseurResponse>(`/fournisseurs/${id}`, data);
        return response.data;
    },

    // ============================================================
    // DELETE / DEACTIVATE
    // ============================================================
    async deleteFournisseur(id: number): Promise<void> {
        await api.delete(`/fournisseurs/${id}`);
    },

    async deactivateFournisseur(id: number): Promise<void> {
        await api.patch(`/fournisseurs/${id}/deactivate`);
    },
};