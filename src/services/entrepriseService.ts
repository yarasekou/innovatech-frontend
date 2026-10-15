import api from './api';
import type { EntrepriseRequest, EntrepriseResponse } from '../types/entreprise';

export const entrepriseService = {
    // ============================================================
    // Mon entreprise
    // ============================================================
    async getMyEntreprise(): Promise<EntrepriseResponse> {
        const response = await api.get<EntrepriseResponse>('/entreprises/me');
        return response.data;
    },

    // ============================================================
    // Par ID (SUPER_ADMIN ou membre)
    // ============================================================
    async getById(id: number): Promise<EntrepriseResponse> {
        const response = await api.get<EntrepriseResponse>(`/entreprises/${id}`);
        return response.data;
    },

    // ============================================================
    // UPDATE — ADMIN uniquement
    // ============================================================
    async update(id: number, data: EntrepriseRequest): Promise<EntrepriseResponse> {
        const response = await api.put<EntrepriseResponse>(`/entreprises/${id}`, data);
        return response.data;
    },

    // ============================================================
    // LOGO
    // ============================================================
    async uploadLogo(file: File): Promise<EntrepriseResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<EntrepriseResponse>(
            '/entreprises/logo',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    async deleteLogo(): Promise<EntrepriseResponse> {
        const response = await api.delete<EntrepriseResponse>('/entreprises/logo');
        return response.data;
    },
};