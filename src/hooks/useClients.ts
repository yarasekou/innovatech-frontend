import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { adminInspectionService } from '../services/adminInspectionService';
import type { ClientResponse } from '../types/client';

export function useClients() {
    const { userId } = useParams<{ userId?: string }>();
    const targetUserId = userId ? Number(userId) : null;

    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadClients = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const data = targetUserId
                ? await adminInspectionService.getClients(targetUserId)
                : await clientService.getClients();

            setClients(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => {
        void loadClients();
    }, [loadClients]);

    return {
        clients,
        loading,
        error,
        isInspection: targetUserId !== null,
        targetUserId,
        reload: loadClients,
    };
}