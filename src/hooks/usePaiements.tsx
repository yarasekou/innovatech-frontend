import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { paiementService } from '../services/paiementService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { PaiementResponse } from '../types/paiement';

export function usePaiements() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [paiements, setPaiements] = useState<PaiementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPaiements = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getPaiements(targetUserId)
                : await paiementService.getPaiements();

            setPaiements(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadPaiements();
    }, [loadPaiements]);

    return {
        paiements,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadPaiements,
    };
}