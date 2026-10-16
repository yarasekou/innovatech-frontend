import api from './api';
import type {
    RetourRequest,
    RetourResponse,
    StatutRetour,
} from '../types/retour';

export const retourService = {
    // ============================================================
    // READ
    // ============================================================
    async getRetours(): Promise<RetourResponse[]> {
        const response = await api.get<RetourResponse[]>('/retours');
        return response.data;
    },

    async getRetourById(id: number): Promise<RetourResponse> {
        const response = await api.get<RetourResponse>(`/retours/${id}`);
        return response.data;
    },

    async getByStatut(statut: StatutRetour): Promise<RetourResponse[]> {
        const response = await api.get<RetourResponse[]>(`/retours/statut/${statut}`);
        return response.data;
    },

    async getByCommande(commandeId: number): Promise<RetourResponse[]> {
        const response = await api.get<RetourResponse[]>(
            `/retours/commande/${commandeId}`
        );
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createRetour(data: RetourRequest): Promise<RetourResponse> {
        const response = await api.post<RetourResponse>('/retours', data);
        return response.data;
    },

    // ============================================================
    // STATUT
    // ============================================================
    async changerStatut(id: number, statut: StatutRetour): Promise<RetourResponse> {
        const response = await api.patch<RetourResponse>(`/retours/${id}/statut`, null, {
            params: { statut },
        });
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deleteRetour(id: number): Promise<void> {
        await api.delete(`/retours/${id}`);
    },
};