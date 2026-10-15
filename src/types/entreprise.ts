// ============================================================
// Requêtes
// ============================================================

export interface EntrepriseRequest {
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
}

// ============================================================
// Réponses
// ============================================================

export interface EntrepriseResponse {
    id: number;
    nom: string;
    slug: string;
    description: string | null;
    email: string | null;
    telephone: string | null;
    adresse: string | null;
    ville: string | null;
    pays: string | null;
    siret: string | null;
    devise: string;
    tvaPercent: number;
    logo: string | null;
    logoUrl: string | null;
    actif: boolean;

    // Owner
    ownerId: number | null;
    ownerEmail: string | null;
    ownerNom: string | null;
    ownerPrenom: string | null;

    dateCreation: string;
    dateModification: string;
}