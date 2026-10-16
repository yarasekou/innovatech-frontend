// ============================================================
// Requêtes
// ============================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterAdminRequest {
    username: string;
    email: string;
    password: string;
    prenom?: string;
    nom?: string;
    entreprise: {
        nom: string;
        description?: string;
        email?: string;
        telephone?: string;
        adresse?: string;
        ville?: string;
        pays?: string;
        siret?: string;
        devise?: string;
        tvaPercent?: number;
    };
}

export interface UpdateProfileRequest {
    prenom?: string;
    nom?: string;
    email?: string;
    username?: string;
}

export interface ChangePasswordDTO {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
}

// ============================================================
// Réponses
// ============================================================

export interface AuthResponse {
    token: string;
    type: string;
    email: string;
    username: string;
    roles: string[];
    expiresIn: number;
}

// ============================================================
// Utilisateur connecté
// ============================================================

export interface CurrentUser {
    email: string;
    username: string;
    roles: string[];
}

// ============================================================
// Rôles
// ============================================================

export type Role = 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_SELLER';

export const hasRole = (roles: string[], role: Role): boolean => {
    return roles.includes(role);
};

export const isAdmin = (roles: string[]): boolean => hasRole(roles, 'ROLE_ADMIN');
export const isSuperAdmin = (roles: string[]): boolean => hasRole(roles, 'ROLE_SUPER_ADMIN');
export const isUser = (roles: string[]): boolean => hasRole(roles, 'ROLE_USER');
export const isSeller = (roles: string[]): boolean => hasRole(roles, 'ROLE_SELLER');

/**
 * True si l'utilisateur appartient à une entreprise (ADMIN, USER ou SELLER).
 */
export const isTenant = (roles: string[]): boolean =>
    isAdmin(roles) || isUser(roles) || isSeller(roles);