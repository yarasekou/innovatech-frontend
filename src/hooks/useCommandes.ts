import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { commandeService } from '../services/commandeService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { CommandeResponse } from '../types/commande';

export function useCommandes() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [commandes, setCommandes] = useState<CommandeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCommandes = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getCommandes(targetUserId)
                : await commandeService.getCommandes();

            setCommandes(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadCommandes();
    }, [loadCommandes]);

    return {
        commandes,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadCommandes,
    };
}