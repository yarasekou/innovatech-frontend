// ============================================================
// Enums
// ============================================================

export type MethodePaiement =
    | 'ESPECES'
    | 'VIREMENT'
    | 'CARTE'
    | 'MOBILE_MONEY'
    | 'CHEQUE'
    | 'WAVE'
    | 'ORANGE_MONEY';

export type StatutPaiement =
    | 'EN_ATTENTE'
    | 'VALIDE'
    | 'REMBOURSE'
    | 'ANNULE';

export interface MethodePaiementOption {
    value: MethodePaiement;
    label: string;
    icon: string;
}

export interface StatutPaiementOption {
    value: StatutPaiement;
    label: string;
    color: string;   // classes Tailwind
}

// ============================================================
// Requêtes
// ============================================================

export interface PaiementRequest {
    commandeId?: number;
    commandeAchatId?: number;
    montant: number;
    methode: MethodePaiement;
    reference?: string;
    notes?: string;
}

// ============================================================
// Réponses
// ============================================================

export interface PaiementResponse {
    id: number;
    numero: string;
    commandeId: number | null;
    commandeNumero: string | null;
    commandeAchatId: number | null;
    commandeAchatNumero: string | null;
    montant: number;
    methode: MethodePaiement;
    methodeLibelle: string;
    statut: StatutPaiement;
    statutLibelle: string;
    reference: string | null;
    notes: string | null;
    datePaiement: string;   // ISO datetime
    dateCreation: string;
    dateModification: string;

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
// Reste à payer
// ============================================================

export interface ResteAPayer {
    commandeId: number;
    commandeNumero: string;
    totalTTC: number;
    totalPaye: number;
    resteAPayer: number;
    solde: boolean;
}

// ============================================================
// Métadonnées d'affichage
// ============================================================

export const METHODES_PAIEMENT: MethodePaiementOption[] = [
    { value: 'ESPECES', label: 'Espèces', icon: '💵' },
    { value: 'VIREMENT', label: 'Virement bancaire', icon: '🏦' },
    { value: 'CARTE', label: 'Carte bancaire', icon: '💳' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: '📱' },
    { value: 'CHEQUE', label: 'Chèque', icon: '📝' },
    { value: 'WAVE', label: 'Wave', icon: '🌊' },
    { value: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠' },
];

export const STATUTS_PAIEMENT: StatutPaiementOption[] = [
    { value: 'EN_ATTENTE', label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'VALIDE', label: 'Validé', color: 'bg-green-100 text-green-700' },
    { value: 'REMBOURSE', label: 'Remboursé', color: 'bg-purple-100 text-purple-700' },
    { value: 'ANNULE', label: 'Annulé', color: 'bg-red-100 text-red-700' },
];

export const getMethodeOption = (m: MethodePaiement): MethodePaiementOption =>
    METHODES_PAIEMENT.find((x) => x.value === m) || METHODES_PAIEMENT[0];

export const getStatutPaiementOption = (s: StatutPaiement): StatutPaiementOption =>
    STATUTS_PAIEMENT.find((x) => x.value === s) || STATUTS_PAIEMENT[0];

// ============================================================
// Badge de solde commande
// ============================================================

export type EtatSolde = 'SOLDE' | 'PARTIEL' | 'IMPAYE';

export const getEtatSolde = (reste: ResteAPayer | null): EtatSolde => {
    if (!reste) return 'IMPAYE';
    if (reste.solde) return 'SOLDE';
    if (reste.totalPaye > 0) return 'PARTIEL';
    return 'IMPAYE';
};

export const ETAT_SOLDE_LABELS: Record<EtatSolde, { label: string; color: string }> = {
    SOLDE: { label: 'Payé', color: 'bg-green-100 text-green-700' },
    PARTIEL: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700' },
    IMPAYE: { label: 'Impayé', color: 'bg-red-100 text-red-700' },
};