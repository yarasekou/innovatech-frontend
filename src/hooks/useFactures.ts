import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { factureService } from '../services/factureService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { FactureResponse } from '../types/facture';

export function useFactures() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [factures, setFactures] = useState<FactureResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFactures = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getFactures(targetUserId)
                : await factureService.getFactures();

            setFactures(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadFactures();
    }, [loadFactures]);

    return {
        factures,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadFactures,
    };
}