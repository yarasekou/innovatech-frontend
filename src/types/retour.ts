// ============================================================
// Enums
// ============================================================

export type StatutRetour =
    | 'DEMANDE'
    | 'ACCEPTE'
    | 'REFUSE'
    | 'RECU'
    | 'REMBOURSE';

export interface StatutRetourOption {
    value: StatutRetour;
    label: string;
    color: string;
}

// ============================================================
// Requêtes
// ============================================================

export interface LigneRetourRequest {
    produitId: number;
    quantite: number;
    raison?: string;
}

export interface RetourRequest {
    commandeId: number;
    motif: string;
    notes?: string;
    lignes: LigneRetourRequest[];
}

// ============================================================
// Réponses
// ============================================================

export interface LigneRetourResponse {
    id: number;
    produitId: number;
    produitReference: string;
    produitNom: string;
    quantite: number;
    prixUnitaire: number;
    sousTotal: number;
    raison: string | null;
}

export interface RetourResponse {
    id: number;
    numero: string;
    commandeId: number | null;
    commandeNumero: string | null;
    clientId: number | null;
    clientNom: string | null;
    clientPrenom: string | null;
    clientEmail: string | null;
    userId: number | null;
    userEmail: string | null;
    statut: StatutRetour;
    statutLibelle: string;
    motif: string | null;
    notes: string | null;
    montantTotal: number;
    dateDemande: string;
    dateTraitement: string | null;
    dateCreation: string;
    dateModification: string;
    lignes: LigneRetourResponse[];

    // Entreprise
    entrepriseId: number | null;
    entrepriseNom: string | null;
}

// ============================================================
// Métadonnées d'affichage
// ============================================================

export const STATUTS_RETOUR: StatutRetourOption[] = [
    {
        value: 'DEMANDE',
        label: 'Demande',
        color: 'bg-yellow-100 text-yellow-700',
    },
    {
        value: 'ACCEPTE',
        label: 'Accepté',
        color: 'bg-blue-100 text-blue-700',
    },
    {
        value: 'REFUSE',
        label: 'Refusé',
        color: 'bg-red-100 text-red-700',
    },
    {
        value: 'RECU',
        label: 'Reçu',
        color: 'bg-indigo-100 text-indigo-700',
    },
    {
        value: 'REMBOURSE',
        label: 'Remboursé',
        color: 'bg-green-100 text-green-700',
    },
];

export const getStatutRetourOption = (s: StatutRetour): StatutRetourOption =>
    STATUTS_RETOUR.find((x) => x.value === s) || STATUTS_RETOUR[0];

// ============================================================
// Transitions autorisées
// ============================================================

export const TRANSITIONS_RETOUR: Record<StatutRetour, StatutRetour[]> = {
    DEMANDE: ['ACCEPTE', 'REFUSE'],
    ACCEPTE: ['RECU', 'REFUSE'],
    REFUSE: [],
    RECU: ['REMBOURSE'],
    REMBOURSE: [],
};