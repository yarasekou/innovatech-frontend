export interface DashboardStats {
    chiffreAffairesHT: number;
    chiffreAffairesTTC: number;
    margeTotale: number;

    nbClients: number;
    nbProduits: number;
    nbCommandes: number;
    nbPaiements: number;
    nbCommandesAchat: number;

    nbCommandesEnAttente: number;
    nbCommandesValidees: number;
    nbCommandesEnCours: number;
    nbCommandesLivrees: number;
    nbCommandesAnnulees: number;

    panierMoyen: number;
}

export interface TopProduit {
    produitId: number;
    reference: string;
    nom: string;
    quantiteVendue: number;
    chiffreAffaires: number;
}

export interface TopClient {
    clientId: number;
    nom: string;
    prenom: string;
    email: string;
    nbCommandes: number;
    chiffreAffaires: number;
}

export interface ChiffreAffairesMois {
    annee: number;
    mois: number;
    libelle: string;
    chiffreAffaires: number;
    nbCommandes: number;
}