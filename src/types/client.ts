// ============================================================
// Requêtes
// ============================================================

export interface ClientRequest {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    siret?: string;
    actif?: boolean;
}

// ============================================================
// Réponses
// ============================================================

export interface ClientResponse {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    adresse: string | null;
    ville: string | null;
    pays: string | null;
    siret: string | null;
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