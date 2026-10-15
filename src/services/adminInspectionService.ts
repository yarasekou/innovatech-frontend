import api from './api';
import type { UserResponse } from '../types/user';
import type { ProduitResponse } from '../types/produit';
import type { CategorieResponse } from '../types/categorie';
import type {ClientResponse} from "../types/client.ts";

export const adminInspectionService = {
    async getProfil(userId: number): Promise<UserResponse> {
        const response = await api.get<UserResponse>(`/admin/users/${userId}/profil`);
        return response.data;
    },

    async getProduits(userId: number): Promise<ProduitResponse[]> {
        const response = await api.get<ProduitResponse[]>(`/admin/users/${userId}/produits`);
        return response.data;
    },

    async getCategories(userId: number): Promise<CategorieResponse[]> {
        const response = await api.get<CategorieResponse[]>(`/admin/users/${userId}/categories`);
        return response.data;
    },

    async getClients(userId: number): Promise<ClientResponse[]> {
        const response = await api.get<ClientResponse[]>(`/admin/users/${userId}/clients`);
        return response.data;
    },
};