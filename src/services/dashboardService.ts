import api from './api';
import type {
    DashboardStats,
    TopProduit,
    TopClient,
    ChiffreAffairesMois,
} from '../types/dashboard';

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    },

    async getTopProduits(limit = 5): Promise<TopProduit[]> {
        const response = await api.get<TopProduit[]>('/dashboard/top-produits', {
            params: { limit },
        });
        return response.data;
    },

    async getTopClients(limit = 5): Promise<TopClient[]> {
        const response = await api.get<TopClient[]>('/dashboard/top-clients', {
            params: { limit },
        });
        return response.data;
    },

    async getChiffreAffairesMensuel(): Promise<ChiffreAffairesMois[]> {
        const response = await api.get<ChiffreAffairesMois[]>('/dashboard/ca-mensuel');
        return response.data;
    },
};