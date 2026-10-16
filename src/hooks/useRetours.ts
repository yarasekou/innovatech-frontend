import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { retourService } from '../services/retourService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { RetourResponse } from '../types/retour';

export function useRetours() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [retours, setRetours] = useState<RetourResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRetours = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getRetours(targetUserId)
                : await retourService.getRetours();

            setRetours(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadRetours();
    }, [loadRetours]);

    return {
        retours,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadRetours,
    };
}