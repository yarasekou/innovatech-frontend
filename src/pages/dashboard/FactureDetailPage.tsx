import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ArrowDownTrayIcon, // ⚠️ NOUVEAU : Icône de téléchargement
    PaperAirplaneIcon,
    TrashIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { factureService } from '../../services/factureService';
import { commandeService } from '../../services/commandeService';
import { commandeAchatService } from '../../services/commandeAchatService';
import api from '../../services/api'; // ⚠️ NOUVEAU : Pour télécharger le PDF
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import { getStatutFactureOption, type FactureResponse } from '../../types/facture';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function FactureDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const factureId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/factures`
        : '/dashboard/factures';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;

    const [facture, setFacture] = useState<FactureResponse | null>(null);
    const [lignes, setLignes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloading, setDownloading] = useState(false); // ⚠️ NOUVEAU : État de téléchargement

    // ============================================================
    // Charger la facture ET les lignes
    // ============================================================
    const loadData = useCallback(async (): Promise<void> => {
        if (!id || Number.isNaN(factureId)) {
            setError('Identifiant invalide');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);

            const data = await factureService.getFactureById(factureId);
            setFacture(data);

            if (data.commandeId) {
                const cmd = await commandeService.getCommandeById(data.commandeId);
                setLignes(cmd.lignes || []);
            } else if (data.commandeAchatId) {
                const cmdAchat = await commandeAchatService.getCommandeAchatById(data.commandeAchatId);
                const lignesAdaptees = (cmdAchat.lignes || []).map((l: any) => ({
                    ...l,
                    prixUnitaire: l.prixAchatUnitaire || 0,
                }));
                setLignes(lignesAdaptees);
            }
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Facture introuvable');
        } finally {
            setLoading(false);
        }
    }, [factureId, id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // ============================================================
    // Actions
    // ============================================================
    const handleAction = async (action: 'emettre' | 'payer' | 'annuler' | 'supprimer') => {
        if (!facture) return;

        const messages = {
            emettre: 'Émettre cette facture ? Elle ne sera plus modifiable.',
            payer: 'Marquer cette facture comme PAYÉE ?',
            annuler: 'Annuler cette facture ? Cette action est irréversible.',
            supprimer: 'Supprimer définitivement cette facture brouillon ?',
        };

        if (!confirm(messages[action])) return;

        try {
            setActionLoading(true);
            if (action === 'supprimer') {
                await factureService.deleteFacture(facture.id);
                navigate(basePath);
                return;
            }

            let updated: FactureResponse;
            if (action === 'emettre') updated = await factureService.emettre(facture.id);
            else if (action === 'payer') updated = await factureService.marquerPayee(facture.id);
            else updated = await factureService.annuler(facture.id);

            setFacture(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================================
    // Téléchargement PDF (avec token JWT)
    // ============================================================
    const handleDownloadPdf = async () => {
        if (!facture) return;
        try {
            setDownloading(true);
            // On utilise Axios pour envoyer le token JWT
            const response = await api.get(`/factures/${facture.id}/pdf`, {
                responseType: 'blob', // Important pour les fichiers
            });

            // Créer un lien temporaire pour télécharger le fichier
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `facture-${facture.numero}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Nettoyage
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erreur téléchargement PDF", err);
            alert("Impossible de télécharger le PDF. Vérifiez que le backend est démarré.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl max-w-2xl mx-auto mt-10">
                <p>{error}</p>
                <button onClick={() => navigate(basePath)} className="mt-4 underline text-sm">
                    Retour aux factures
                </button>
            </div>
        );
    }

    if (!facture) return null;

    const statut = getStatutFactureOption(facture.statut);
    const isAchat = !!facture.commandeAchatId;

    return (
        <div className="p-8 print:p-0 bg-gray-50 min-h-screen">
            {/* Actions */}
            <div className="print:hidden max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(basePath)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Retour aux factures
                </button>

                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-bold text-gray-900">Facture {facture.numero}</h1>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statut.color}`}>
                                {statut.label}
                            </span>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex flex-wrap gap-2">
                            {/* ⚠️ BOUTON PDF MODIFIÉ */}
                            <Button
                                variant="secondary"
                                icon={<ArrowDownTrayIcon className="h-4 w-4" />}
                                onClick={handleDownloadPdf}
                                loading={downloading}
                            >
                                Télécharger PDF
                            </Button>

                            {facture.statut === 'BROUILLON' && (
                                <>
                                    <Button icon={<PaperAirplaneIcon className="h-4 w-4" />} onClick={() => handleAction('emettre')} loading={actionLoading}>
                                        Émettre
                                    </Button>
                                    <Button variant="danger" icon={<TrashIcon className="h-4 w-4" />} onClick={() => handleAction('supprimer')}>
                                        Supprimer
                                    </Button>
                                </>
                            )}

                            {(facture.statut === 'EMISE' || facture.statut === 'EN_RETARD') && (
                                <>
                                    <Button icon={<BanknotesIcon className="h-4 w-4" />} onClick={() => handleAction('payer')} loading={actionLoading}>
                                        Marquer Payée
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 🖨️ DOCUMENT FACTURE (Format A4) */}
            <div className="bg-white mx-auto max-w-[210mm] shadow-lg print:shadow-none print:w-full print:max-w-none relative overflow-hidden">

                {/* Filigrane PAYÉ */}
                {facture.statut === 'PAYEE' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] -rotate-45 z-0">
                        <span className="text-[200px] font-black text-green-600 tracking-widest uppercase">Payée</span>
                    </div>
                )}

                <div className="p-12 relative z-10">
                    {/* En-tête */}
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                    <BuildingOffice2Icon className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">{facture.entrepriseNom}</h2>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 font-medium">{facture.entrepriseNom} SARL</p>
                            <p className="text-sm text-gray-500">Dakar, Sénégal</p>
                            <p className="text-sm text-gray-500 mt-1">contact@jokko.example</p>
                            <p className="text-sm text-gray-500">+221 70 123 45 03</p>
                        </div>

                        <div className="text-right">
                            <h1 className="text-4xl font-light text-gray-400 uppercase tracking-widest mb-1">Facture</h1>
                            <p className="text-xl font-mono font-bold text-gray-900">{facture.numero}</p>

                            <div className="mt-4 space-y-1">
                                <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Date d'émission :</span> {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</p>
                                <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Date d'échéance :</span> {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bloc Client / Fournisseur */}
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-1/2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                {isAchat ? 'Fournisseur' : 'Facturé à'}
                            </p>
                            <p className="font-bold text-gray-900 text-lg">{facture.clientNom}</p>
                            <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                                {facture.clientAdresse && <p className="whitespace-pre-line">{facture.clientAdresse}</p>}
                                {facture.clientEmail && <p>{facture.clientEmail}</p>}
                                {facture.clientTelephone && <p>{facture.clientTelephone}</p>}
                                {facture.clientSiret && <p className="font-mono mt-1">SIRET : {facture.clientSiret}</p>}
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Références</p>
                            <p className="text-sm text-gray-600">
                                {isAchat ? 'Achat' : 'Commande'}{' '}
                                <span className="font-mono font-medium text-gray-900">
                                    {isAchat ? facture.commandeAchatNumero : facture.commandeNumero || '—'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Tableau des Lignes */}
                    <table className="w-full mb-8">
                        <thead>
                        <tr className="border-b border-gray-200">
                            <th className="py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest w-1/2">Description</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Prix Unitaire</th>
                            <th className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Qté</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Total HT</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {lignes.map((l, index) => (
                            <tr key={index}>
                                <td className="py-4">
                                    <p className="font-medium text-gray-900">{l.produitNom}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{l.produitReference}</p>
                                </td>
                                <td className="py-4 text-right text-sm text-gray-700">
                                    {l.prixUnitaire.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="py-4 text-center text-sm text-gray-700">
                                    {l.quantite}
                                </td>
                                <td className="py-4 text-right text-sm font-medium text-gray-900">
                                    {(l.sousTotal || (l.prixUnitaire * l.quantite)).toLocaleString('fr-FR')} FCFA
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* Totaux */}
                    <div className="flex justify-end border-t-2 border-gray-100 pt-6">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Total HT</span>
                                <span className="font-medium text-gray-900">{facture.totalHT.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>TVA ({facture.tvaPercent}%)</span>
                                <span className="font-medium text-gray-900">{(facture.totalTTC - facture.totalHT).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                                <span className="font-bold text-gray-900">Total TTC</span>
                                <span className="text-xl font-black text-primary-600">{facture.totalTTC.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Pied de page */}
                    <div className="mt-16 pt-8 border-t border-gray-100 text-xs text-gray-400 text-center space-y-1">
                        <p className="font-medium text-gray-500">{facture.entrepriseNom} - SARL au capital de 1 000 000 FCFA</p>
                        <p>Dakar, Sénégal - NINEA : 123456789 - RC : SN-DKR-2026-B-1234</p>
                        <p>Merci de votre confiance !</p>
                    </div>
                </div>
            </div>
        </div>
    );
}