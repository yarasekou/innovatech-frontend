// ============================================================
// Requêtes
// ============================================================

export interface CategorieRequest {
    nom: string;
    slug?: string;
    description?: string;
    parentId?: number | null;
    actif?: boolean;
}

// ============================================================
// Réponses
// ============================================================

export interface CategorieResponse {
    id: number;
    nom: string;
    slug: string;
    description: string | null;

    // Hiérarchie
    parentId: number | null;
    parentNom: string | null;
    niveau: number;
    cheminComplet: string | null;

    // Entreprise + User
    entrepriseId: number | null;
    entrepriseNom: string | null;
    userId: number | null;
    userEmail: string | null;

    actif: boolean;
    dateCreation: string;
    dateModification: string;
}

// ============================================================
// Arbre
// ============================================================

export interface CategorieTree {
    id: number;
    nom: string;
    slug: string;
    niveau: number;
    cheminComplet: string | null;
    actif: boolean;
    enfants: CategorieTree[];
}