import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fournisseurService } from '../services/fournisseurService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { FournisseurResponse } from '../types/fournisseur';

export function useFournisseurs() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [fournisseurs, setFournisseurs] = useState<FournisseurResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFournisseurs = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getFournisseurs(targetUserId)
                : await fournisseurService.getFournisseurs();

            setFournisseurs(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadFournisseurs();
    }, [loadFournisseurs]);

    return {
        fournisseurs,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadFournisseurs,
    };
}