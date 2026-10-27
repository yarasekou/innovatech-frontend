import api from './api';
import type { FactureRequest, FactureResponse } from '../types/facture';

export const factureService = {
    async getFactures(): Promise<FactureResponse[]> {
        const response = await api.get<FactureResponse[]>('/factures');
        return response.data;
    },

    async getFactureById(id: number): Promise<FactureResponse> {
        const response = await api.get<FactureResponse>(`/factures/${id}`);
        return response.data;
    },

    async getByCommande(commandeId: number): Promise<FactureResponse> {
        const response = await api.get<FactureResponse>(`/factures/commande/${commandeId}`);
        return response.data;
    },
    async getByCommandeAchat(commandeAchatId: number): Promise<FactureResponse | null> {
        try {
            const response = await api.get<FactureResponse>(`/factures/commande-achat/${commandeAchatId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null; // Pas de facture, c'est normal
            }
            throw error;
        }
    },

    async createFacture(data: FactureRequest): Promise<FactureResponse> {
        const response = await api.post<FactureResponse>('/factures', data);
        return response.data;
    },

    // ⚠️ NOUVEAU : Créer une facture pour un achat
    async createFactureAchat(data: { commandeAchatId: number }): Promise<FactureResponse> {
        const response = await api.post<FactureResponse>('/factures', data);
        return response.data;
    },

    async emettre(id: number): Promise<FactureResponse> {
        const response = await api.patch<FactureResponse>(`/factures/${id}/emettre`);
        return response.data;
    },

    async marquerPayee(id: number): Promise<FactureResponse> {
        const response = await api.patch<FactureResponse>(`/factures/${id}/payer`);
        return response.data;
    },

    async annuler(id: number): Promise<FactureResponse> {
        const response = await api.patch<FactureResponse>(`/factures/${id}/annuler`);
        return response.data;
    },

    async deleteFacture(id: number): Promise<void> {
        await api.delete(`/factures/${id}`);
    },
};