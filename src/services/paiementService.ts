import api from './api';
import type {
    PaiementRequest,
    PaiementResponse,
    ResteAPayer,
    StatutPaiement,
} from '../types/paiement';

export const paiementService = {
    // ============================================================
    // READ
    // ============================================================
    async getPaiements(): Promise<PaiementResponse[]> {
        const response = await api.get<PaiementResponse[]>('/paiements');
        return response.data;
    },

    async getPaiementById(id: number): Promise<PaiementResponse> {
        const response = await api.get<PaiementResponse>(`/paiements/${id}`);
        return response.data;
    },

    async getByCommande(commandeId: number): Promise<PaiementResponse[]> {
        const response = await api.get<PaiementResponse[]>(
            `/paiements/commande/${commandeId}`
        );
        return response.data;
    },

    async getByStatut(statut: StatutPaiement): Promise<PaiementResponse[]> {
        const response = await api.get<PaiementResponse[]>(
            `/paiements/statut/${statut}`
        );
        return response.data;
    },

    // ============================================================
    // RESTE À PAYER
    // ============================================================
    async getResteAPayer(commandeId: number): Promise<ResteAPayer> {
        const response = await api.get<ResteAPayer>(
            `/paiements/commande/${commandeId}/reste`
        );
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createPaiement(data: PaiementRequest): Promise<PaiementResponse> {
        const response = await api.post<PaiementResponse>('/paiements', data);
        return response.data;
    },

    // ============================================================
    // STATUT
    // ============================================================
    async changerStatut(id: number, statut: StatutPaiement): Promise<PaiementResponse> {
        const response = await api.patch<PaiementResponse>(
            `/paiements/${id}/statut/${statut}`
        );
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deletePaiement(id: number): Promise<void> {
        await api.delete(`/paiements/${id}`);
    },

    async getByCommandeAchat(commandeAchatId: number): Promise<PaiementResponse[]> {
        const response = await api.get<PaiementResponse[]>(`/paiements/achat/${commandeAchatId}`);
        return response.data;
    },
};