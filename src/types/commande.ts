// ============================================================
// Enums
// ============================================================

export type StatutCommande =
    | 'EN_ATTENTE'
    | 'VALIDEE'
    | 'EN_COURS'
    | 'LIVREE'
    | 'ANNULEE';

export interface StatutCommandeOption {
    value: StatutCommande;
    label: string;
    color: string;   // classe Tailwind pour badge
}

// ============================================================
// Requêtes
// ============================================================

export interface LigneCommandeRequest {
    produitId: number;
    quantite: number;
}

export interface CommandeRequest {
    clientId: number;
    statut?: StatutCommande;
    tvaPercent?: number;
    notes?: string;
    dateLivraisonPrevue?: string;   // ISO date (yyyy-MM-dd)
    lignes: LigneCommandeRequest[];
}

// ============================================================
// Réponses
// ============================================================

export interface ClientSummary {
    id: number;
    nom: string;
    prenom: string;
    email: string;
}

export interface LigneCommandeResponse {
    id: number;
    produitId: number;
    produitReference: string;
    produitNom: string;
    quantite: number;
    prixUnitaire: number;
    sousTotal: number;
}

export interface CommandeResponse {
    id: number;
    numero: string;
    client: ClientSummary | null;
    statut: StatutCommande;
    statutLibelle: string;
    totalHT: number;
    tvaPercent: number;
    totalTTC: number;
    notes: string | null;
    dateCommande: string;            // ISO datetime
    dateLivraisonPrevue: string | null;
    dateCreation: string;
    dateModification: string;
    lignes: LigneCommandeResponse[];

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;

    // User (boutique)
    userId: number | null;
    userEmail: string | null;
    userNom: string | null;
    userPrenom: string | null;
}

// ============================================================
// Statuts — métadonnées d'affichage
// ============================================================

export const STATUTS_COMMANDE: StatutCommandeOption[] = [
    {
        value: 'EN_ATTENTE',
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-700',
    },
    {
        value: 'VALIDEE',
        label: 'Validée',
        color: 'bg-blue-100 text-blue-700',
    },
    {
        value: 'EN_COURS',
        label: 'En cours',
        color: 'bg-indigo-100 text-indigo-700',
    },
    {
        value: 'LIVREE',
        label: 'Livrée',
        color: 'bg-green-100 text-green-700',
    },
    {
        value: 'ANNULEE',
        label: 'Annulée',
        color: 'bg-red-100 text-red-700',
    },
];

export const getStatutOption = (statut: StatutCommande): StatutCommandeOption =>
    STATUTS_COMMANDE.find((s) => s.value === statut) || STATUTS_COMMANDE[0];

// ============================================================
// Transitions autorisées (côté back : CommandeService)
// ============================================================

export const TRANSITIONS_AUTORISEES: Record<StatutCommande, StatutCommande[]> = {
    EN_ATTENTE: ['VALIDEE', 'ANNULEE'],
    VALIDEE: ['EN_COURS', 'ANNULEE'],
    EN_COURS: ['LIVREE', 'ANNULEE'],
    LIVREE: [],
    ANNULEE: [],
};