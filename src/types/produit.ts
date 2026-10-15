// ============================================================
// Requêtes
// ============================================================

export interface ProduitRequest {
    reference: string;
    nom: string;
    description?: string;
    prix: number;
    prixAchat: number;
    stock: number;
    categorieId?: number;
    actif?: boolean;
}

// ============================================================
// Réponses
// ============================================================

export interface PhotoProduitResponse {
    id: number;
    produitId: number;
    url: string;
    nomFichier: string;
    titre: string | null;
    principale: boolean;
    ordre: number;
    taille: number;
    typeMime: string;
    dateCreation: string;
}

export interface ProduitResponse {
    id: number;
    reference: string;
    nom: string;
    description: string | null;
    prix: number;
    prixAchat: number;
    margeUnitaire: number;
    tauxMarge: number;
    stock: number;

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;

    // Catégorie
    categorieId: number | null;
    categorieNom: string | null;
    categorieSlug: string | null;
    categorieChemin: string | null;
    categorieNiveau: number | null;

    // User propriétaire
    userId: number | null;
    userEmail: string | null;
    userNom: string | null;
    userPrenom: string | null;

    // Photos
    photos: PhotoProduitResponse[];
    photoPrincipale: string | null;
    nbPhotos: number;

    actif: boolean;
    dateCreation: string;
    dateModification: string;
}