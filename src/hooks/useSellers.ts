import { useState, useEffect, useCallback } from 'react';
import { sellerService } from '../services/sellerService';
import type { UserResponse } from '../types/user';

export function useSellers() {
    const [sellers, setSellers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSellers = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await sellerService.getMySellers();
            setSellers(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSellers();
    }, [loadSellers]);

    return {
        sellers,
        loading,
        error,
        reload: loadSellers,
    };
}