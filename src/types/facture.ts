export type StatutFacture = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';

export interface StatutFactureOption {
    value: StatutFacture;
    label: string;
    color: string;
}

export interface FactureRequest {
    commandeId: number;
    dateEmission?: string;
    notes?: string;
}

export interface FactureResponse {
    id: number;
    numero: string;
    commandeId: number | null;
    commandeNumero: string | null;
    clientId: number | null;
    clientNom: string | null;
    clientAdresse: string | null;
    clientSiret: string | null;
    clientEmail: string | null;
    clientTelephone: string | null;
    totalHT: number;
    tvaPercent: number;
    totalTTC: number;
    dateEmission: string;
    dateEcheance: string;
    datePaiement: string | null;
    statut: StatutFacture;
    statutLibelle: string;
    enRetard: boolean;
    joursDeRetard: number;
    pdfUrl: string | null;
    notes: string | null;
    dateCreation: string;
    dateModification: string;
    entrepriseId: number | null;
    entrepriseNom: string | null;
    userId: number | null;
    userEmail: string | null;
    userNom: string | null;
    userPrenom: string | null;
}

export const STATUTS_FACTURE: StatutFactureOption[] = [
    { value: 'BROUILLON', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
    { value: 'EMISE', label: 'Émise', color: 'bg-blue-100 text-blue-700' },
    { value: 'PAYEE', label: 'Payée', color: 'bg-green-100 text-green-700' },
    { value: 'EN_RETARD', label: 'En retard', color: 'bg-red-100 text-red-700' },
    { value: 'ANNULEE', label: 'Annulée', color: 'bg-gray-200 text-gray-600' },
];

export const getStatutFactureOption = (s: StatutFacture): StatutFactureOption =>
    STATUTS_FACTURE.find((x) => x.value === s) || STATUTS_FACTURE[0];