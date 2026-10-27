import api from './api';
import type {
    DashboardStats,
    TopProduit,
    TopClient,
    ChiffreAffairesMois,
} from '../types/dashboard';

export const dashboardService = {
    async getStats(dateDebut?: string, dateFin?: string): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/dashboard/stats', {
            params: { dateDebut, dateFin }, // ⚠️ AJOUTÉ
        });
        return response.data;
    },

    async getTopProduits(limit = 5, dateDebut?: string, dateFin?: string): Promise<TopProduit[]> {
        const response = await api.get<TopProduit[]>('/dashboard/top-produits', {
            params: { limit, dateDebut, dateFin }, // ⚠️ AJOUTÉ
        });
        return response.data;
    },

    async getTopClients(limit = 5, dateDebut?: string, dateFin?: string): Promise<TopClient[]> {
        const response = await api.get<TopClient[]>('/dashboard/top-clients', {
            params: { limit, dateDebut, dateFin }, // ⚠️ AJOUTÉ
        });
        return response.data;
    },

    async getChiffreAffairesMensuel(dateDebut?: string, dateFin?: string): Promise<ChiffreAffairesMois[]> {
        const response = await api.get<ChiffreAffairesMois[]>('/dashboard/ca-mensuel', {
            params: { dateDebut, dateFin }, // ⚠️ AJOUTÉ
        });
        return response.data;
    },
};