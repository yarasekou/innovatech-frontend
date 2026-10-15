import api from './api';
import type { ProduitRequest, ProduitResponse } from '../types/produit';

export const produitService = {
    // ============================================================
    // READ
    // ============================================================
    async getProduits(): Promise<ProduitResponse[]> {
        const response = await api.get<ProduitResponse[]>('/produits');
        return response.data;
    },

    async getProduitById(id: number): Promise<ProduitResponse> {
        const response = await api.get<ProduitResponse>(`/produits/${id}`);
        return response.data;
    },

    async searchProduits(query: string): Promise<ProduitResponse[]> {
        const response = await api.get<ProduitResponse[]>('/produits/search', {
            params: { q: query },
        });
        return response.data;
    },

    async getByCategorie(categorieId: number, deep: boolean = false): Promise<ProduitResponse[]> {
        const response = await api.get<ProduitResponse[]>(`/produits/categorie/${categorieId}`, {
            params: { deep },
        });
        return response.data;
    },

    async getStockFaible(seuil: number = 10): Promise<ProduitResponse[]> {
        const response = await api.get<ProduitResponse[]>('/produits/stock-faible', {
            params: { seuil },
        });
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createProduit(data: ProduitRequest): Promise<ProduitResponse> {
        const response = await api.post<ProduitResponse>('/produits', data);
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async updateProduit(id: number, data: ProduitRequest): Promise<ProduitResponse> {
        const response = await api.put<ProduitResponse>(`/produits/${id}`, data);
        return response.data;
    },

    // ============================================================
    // DELETE / DEACTIVATE
    // ============================================================
    async deleteProduit(id: number): Promise<void> {
        await api.delete(`/produits/${id}`);
    },

    async deactivateProduit(id: number): Promise<void> {
        await api.patch(`/produits/${id}/deactivate`);
    },
};