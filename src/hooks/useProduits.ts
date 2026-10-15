import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { produitService } from '../services/produitService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { ProduitResponse } from '../types/produit';

/**
 * Hook pour récupérer les produits.
 * <p>
 * Si on est dans un contexte d'inspection (URL /dashboard/users/:userId/produits),
 * utilise l'API admin. Sinon, utilise l'API normale.
 */
export function useProduits() {
    // Récupère le userId depuis l'URL si présent
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [produits, setProduits] = useState<ProduitResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProduits = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getProduits(targetUserId)   // inspection
                : await produitService.getProduits();                      // normal

            setProduits(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        loadProduits();
    }, [loadProduits]);

    return {
        produits,
        loading,
        error,
        isInspection: targetUserId !== null,   // true si SUPER_ADMIN inspecte
        targetUserId,
        reload: loadProduits,
    };
}