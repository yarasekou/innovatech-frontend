// ============================================================
// Requêtes
// ============================================================

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    prenom?: string;
    nom?: string;
}

export interface UpdateUserRequest {
    prenom?: string;
    nom?: string;
    password?: string;
}

// ============================================================
// Réponses
// ============================================================

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    prenom: string | null;
    nom: string | null;
    roles: string[];
    actif: boolean;

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;

    // Hiérarchie
    patronId: number | null;
    patronEmail: string | null;
    patronNom: string | null;
    patronPrenom: string | null;

    nbEmployes: number;

    dateCreation: string;
    dateModification: string;
}

// ============================================================
// Update Profile
// ============================================================

export interface UpdateProfileRequest {
    prenom?: string;
    nom?: string;
    email?: string;
    username?: string;
}

// ============================================================
// Change Password
// ============================================================

export interface ChangePasswordDTO {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
}