import api from './api';
import type { PhotoProduit } from '../types/photo';

export const photoService = {
    // ============================================================
    // READ
    // ============================================================
    async getPhotos(produitId: number): Promise<PhotoProduit[]> {
        const response = await api.get<PhotoProduit[]>(`/produits/${produitId}/photos`);
        return response.data;
    },

    // ============================================================
    // UPLOAD
    // ============================================================
    async uploadPhoto(
        produitId: number,
        file: File,
        titre?: string,
        principale: boolean = false
    ): Promise<PhotoProduit> {
        const formData = new FormData();
        formData.append('file', file);
        if (titre) formData.append('titre', titre);
        formData.append('principale', String(principale));

        const response = await api.post<PhotoProduit>(
            `/produits/${produitId}/photos`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async setPrincipale(produitId: number, photoId: number): Promise<PhotoProduit> {
        const response = await api.patch<PhotoProduit>(
            `/produits/${produitId}/photos/${photoId}/principale`
        );
        return response.data;
    },

    // ============================================================
    // DELETE
    // ============================================================
    async deletePhoto(produitId: number, photoId: number): Promise<void> {
        await api.delete(`/produits/${produitId}/photos/${photoId}`);
    },
};