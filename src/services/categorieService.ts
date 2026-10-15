import api from './api';
import type { CategorieRequest, CategorieResponse } from '../types/categorie';

export const categorieService = {
    async getCategories(): Promise<CategorieResponse[]> {
        const response = await api.get<CategorieResponse[]>('/categories');
        return response.data;
    },

    async getCategorieById(id: number): Promise<CategorieResponse> {
        const response = await api.get<CategorieResponse>(`/categories/${id}`);
        return response.data;
    },

    async createCategorie(data: CategorieRequest): Promise<CategorieResponse> {
        const response = await api.post<CategorieResponse>('/categories', data);
        return response.data;
    },

    async updateCategorie(id: number, data: CategorieRequest): Promise<CategorieResponse> {
        const response = await api.put<CategorieResponse>(`/categories/${id}`, data);
        return response.data;
    },

    async deleteCategorie(id: number): Promise<void> {
        await api.delete(`/categories/${id}`);
    },
};