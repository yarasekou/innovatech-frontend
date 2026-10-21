import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { commandeAchatService } from '../services/commandeAchatService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { CommandeAchatResponse } from '../types/commandeAchat';

export function useCommandesAchat() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [commandes, setCommandes] = useState<CommandeAchatResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCommandes = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getCommandesAchat(targetUserId)
                : await commandeAchatService.getCommandesAchat();

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