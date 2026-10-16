import api from './api';
import type { CommandeRequest, CommandeResponse, StatutCommande } from '../types/commande';

export const commandeService = {
    // ============================================================
    // READ
    // ============================================================
    async getCommandes(): Promise<CommandeResponse[]> {
        const response = await api.get<CommandeResponse[]>('/commandes');
        return response.data;
    },

    async getCommandeById(id: number): Promise<CommandeResponse> {
        const response = await api.get<CommandeResponse>(`/commandes/${id}`);
        return response.data;
    },

    async getByClient(clientId: number): Promise<CommandeResponse[]> {
        const response = await api.get<CommandeResponse[]>(`/commandes/client/${clientId}`);
        return response.data;
    },

    async getByStatut(statut: StatutCommande): Promise<CommandeResponse[]> {
        const response = await api.get<CommandeResponse[]>(`/commandes/statut/${statut}`);
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createCommande(data: CommandeRequest): Promise<CommandeResponse> {
        const response = await api.post<CommandeResponse>('/commandes', data);
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async updateCommande(id: number, data: CommandeRequest): Promise<CommandeResponse> {
        const response = await api.put<CommandeResponse>(`/commandes/${id}`, data);
        return response.data;
    },

    // ============================================================
    // STATUT
    // ============================================================
    async changerStatut(id: number, statut: StatutCommande): Promise<CommandeResponse> {
        const response = await api.patch<CommandeResponse>(
            `/commandes/${id}/statut/${statut}`
        );
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deleteCommande(id: number): Promise<void> {
        await api.delete(`/commandes/${id}`);
    },
};