import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// ============================================================
// Configuration de base
// ============================================================

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// ============================================================
// Intercepteur de requête : ajoute le token
// ============================================================

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// Intercepteur de réponse : gère le 401
// ============================================================

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const currentPath = window.location.pathname;

        // Routes publiques : ne pas déclencher de logout
        const isPublicRoute =
            currentPath === '/login' ||
            currentPath === '/register' ||
            currentPath === '/';

        // Uniquement si :
        // - 401
        // - PAS sur une route publique
        // - ET un token existait (sinon l'utilisateur est juste anonyme)
        if (status === 401 && !isPublicRoute) {
            const hadToken = !!useAuthStore.getState().token;
            if (hadToken) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;