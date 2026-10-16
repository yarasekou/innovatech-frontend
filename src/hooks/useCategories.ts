import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { categorieService } from '../services/categorieService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { CategorieResponse } from '../types/categorie';

/**
 * Hook pour récupérer les catégories.
 * <p>
 * Si on est dans un contexte d'inspection (URL /dashboard/users/:userId/categories),
 * utilise l'API admin. Sinon, utilise l'API normale.
 */
export function useCategories() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [categories, setCategories] = useState<CategorieResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCategories = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getCategories(targetUserId)
                : await categorieService.getCategories();

            setCategories(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    return {
        categories,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadCategories,
    };
}