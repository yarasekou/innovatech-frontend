import api from './api';
import type {
    CommandeAchatRequest,
    CommandeAchatResponse,
    StatutAchat,
} from '../types/commandeAchat';

export const commandeAchatService = {
    // ============================================================
    // READ
    // ============================================================
    async getCommandesAchat(): Promise<CommandeAchatResponse[]> {
        const response = await api.get<CommandeAchatResponse[]>('/commandes-achat');
        return response.data;
    },

    async getCommandeAchatById(id: number): Promise<CommandeAchatResponse> {
        const response = await api.get<CommandeAchatResponse>(`/commandes-achat/${id}`);
        return response.data;
    },

    async getByFournisseur(fournisseurId: number): Promise<CommandeAchatResponse[]> {
        const response = await api.get<CommandeAchatResponse[]>(
            `/commandes-achat/fournisseur/${fournisseurId}`
        );
        return response.data;
    },

    async getByStatut(statut: StatutAchat): Promise<CommandeAchatResponse[]> {
        const response = await api.get<CommandeAchatResponse[]>(
            `/commandes-achat/statut/${statut}`
        );
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createCommandeAchat(
        data: CommandeAchatRequest
    ): Promise<CommandeAchatResponse> {
        const response = await api.post<CommandeAchatResponse>('/commandes-achat', data);
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async updateCommandeAchat(
        id: number,
        data: CommandeAchatRequest
    ): Promise<CommandeAchatResponse> {
        const response = await api.put<CommandeAchatResponse>(
            `/commandes-achat/${id}`,
            data
        );
        return response.data;
    },

    // ============================================================
    // STATUT
    // ============================================================
    async changerStatut(id: number, statut: StatutAchat): Promise<CommandeAchatResponse> {
        const response = await api.patch<CommandeAchatResponse>(
            `/commandes-achat/${id}/statut/${statut}`
        );
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deleteCommandeAchat(id: number): Promise<void> {
        await api.delete(`/commandes-achat/${id}`);
    },
};