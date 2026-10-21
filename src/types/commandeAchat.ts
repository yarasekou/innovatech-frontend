// ============================================================
// Enums
// ============================================================

export type StatutAchat =
    | 'EN_ATTENTE'
    | 'COMMANDEE'
    | 'RECU_PARTIEL'
    | 'RECUE'
    | 'ANNULEE';

export interface StatutAchatOption {
    value: StatutAchat;
    label: string;
    color: string;
}

// ============================================================
// Requêtes
// ============================================================

export interface LigneCommandeAchatRequest {
    produitId: number;
    quantite: number;
    prixAchatUnitaire?: number;
}

export interface CommandeAchatRequest {
    fournisseurId: number;
    tvaPercent?: number;
    notes?: string;
    dateReceptionPrevue?: string;   // ISO date
    lignes: LigneCommandeAchatRequest[];
}

// ============================================================
// Réponses
// ============================================================

export interface FournisseurSummary {
    id: number;
    code: string;
    nom: string;
    email: string;
}

export interface LigneCommandeAchatResponse {
    id: number;
    produitId: number;
    produitReference: string;
    produitNom: string;
    quantite: number;
    prixAchatUnitaire: number;
    sousTotal: number;
}

export interface CommandeAchatResponse {
    id: number;
    numero: string;
    fournisseur: FournisseurSummary | null;
    statut: StatutAchat;
    statutLibelle: string;
    totalHT: number;
    tvaPercent: number;
    totalTTC: number;
    notes: string | null;
    dateCommande: string;
    dateReceptionPrevue: string | null;
    dateCreation: string;
    dateModification: string;
    lignes: LigneCommandeAchatResponse[];

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;

    // User
    userId: number | null;
    userEmail: string | null;
    userNom: string | null;
    userPrenom: string | null;
}

// ============================================================
// Métadonnées d'affichage
// ============================================================

export const STATUTS_ACHAT: StatutAchatOption[] = [
    {
        value: 'EN_ATTENTE',
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-700',
    },
    {
        value: 'COMMANDEE',
        label: 'Commandée',
        color: 'bg-blue-100 text-blue-700',
    },
    {
        value: 'RECU_PARTIEL',
        label: 'Reçu partiel',
        color: 'bg-orange-100 text-orange-700',
    },
    {
        value: 'RECUE',
        label: 'Reçue',
        color: 'bg-green-100 text-green-700',
    },
    {
        value: 'ANNULEE',
        label: 'Annulée',
        color: 'bg-red-100 text-red-700',
    },
];

export const getStatutAchatOption = (s: StatutAchat): StatutAchatOption =>
    STATUTS_ACHAT.find((x) => x.value === s) || STATUTS_ACHAT[0];

// ============================================================
// Transitions autorisées (alignées sur le back)
// ============================================================

export const TRANSITIONS_ACHAT: Record<StatutAchat, StatutAchat[]> = {
    EN_ATTENTE: ['COMMANDEE', 'ANNULEE'],
    COMMANDEE: ['RECU_PARTIEL', 'RECUE', 'ANNULEE'],
    RECU_PARTIEL: ['RECUE', 'ANNULEE'],
    RECUE: ['ANNULEE'],
    ANNULEE: [],
};