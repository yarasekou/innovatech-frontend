// ============================================================
// Requêtes
// ============================================================

export interface FournisseurRequest {
    code: string;
    nom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    siret?: string;
    contactNom?: string;
    actif?: boolean;
}

// ============================================================
// Réponses
// ============================================================

export interface FournisseurResponse {
    id: number;
    code: string;
    nom: string;
    email: string;
    telephone: string | null;
    adresse: string | null;
    ville: string | null;
    pays: string | null;
    siret: string | null;
    contactNom: string | null;
    actif: boolean;

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;

    // User créateur
    userId: number | null;
    userEmail: string | null;
    userNom: string | null;
    userPrenom: string | null;

    dateCreation: string;
    dateModification: string;
}