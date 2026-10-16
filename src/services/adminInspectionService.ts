import api from './api';
import type { UserResponse } from '../types/user';
import type { ProduitResponse } from '../types/produit';
import type { CategorieResponse } from '../types/categorie';
import type { ClientResponse } from '../types/client';
import type { FournisseurResponse } from '../types/fournisseur';
import type { CommandeResponse } from '../types/commande';
import type { PaiementResponse } from '../types/paiement';
import type {RetourResponse} from "../types/retour.ts";

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

    async getFournisseurs(userId: number): Promise<FournisseurResponse[]> {
        const response = await api.get<FournisseurResponse[]>(
            `/admin/users/${userId}/fournisseurs`
        );
        return response.data;
    },

    async getCommandes(userId: number): Promise<CommandeResponse[]> {
        const response = await api.get<CommandeResponse[]>(
            `/admin/users/${userId}/commandes`
        );
        return response.data;
    },

    async getPaiements(userId: number): Promise<PaiementResponse[]> {
        const response = await api.get<PaiementResponse[]>(
            `/admin/users/${userId}/paiements`
        );
        return response.data;
    },

    async getRetours(userId: number): Promise<RetourResponse[]> {
        const response = await api.get<RetourResponse[]>(
            `/admin/users/${userId}/retours`
        );
        return response.data;
    },
};