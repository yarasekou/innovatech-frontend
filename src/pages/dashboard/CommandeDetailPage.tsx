import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    TruckIcon,
    DocumentTextIcon,
    BanknotesIcon,
    PlusIcon,
    ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { commandeService } from '../../services/commandeService';
import { paiementService } from '../../services/paiementService';
import { retourService } from '../../services/retourService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    getStatutOption,
    TRANSITIONS_AUTORISEES,
    type CommandeResponse,
    type StatutCommande,
} from '../../types/commande';
import {
    METHODES_PAIEMENT,
    ETAT_SOLDE_LABELS,
    getEtatSolde,
    getMethodeOption,
    getStatutPaiementOption,
    type MethodePaiement,
    type PaiementResponse,
    type ResteAPayer,
} from '../../types/paiement';
import {
    getStatutRetourOption,
    type RetourResponse,
} from '../../types/retour';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Composant
// ============================================================

export default function CommandeDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const commandeId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/commandes`
        : '/dashboard/commandes';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;
    const canDelete = checkIsUser(roles) && !isInspection;

    // Commande
    const [commande, setCommande] = useState<CommandeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Paiements
    const [paiements, setPaiements] = useState<PaiementResponse[]>([]);
    const [reste, setReste] = useState<ResteAPayer | null>(null);

    // Retours
    const [retours, setRetours] = useState<RetourResponse[]>([]);

    // Modal paiement
    const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);
    const [paiementSubmitting, setPaiementSubmitting] = useState(false);
    const [paiementForm, setPaiementForm] = useState<{
        montant: number;
        methode: MethodePaiement;
        reference: string;
        notes: string;
    }>({
        montant: 0,
        methode: 'ESPECES',
        reference: '',
        notes: '',
    });

    // ============================================================
    // Charger commande
    // ============================================================
    const loadCommande = useCallback(async (): Promise<void> => {
        // ⚠️ GUARD
        if (!id || Number.isNaN(commandeId)) {
            setError('Identifiant de commande invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await commandeService.getCommandeById(commandeId);
            setCommande(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Commande introuvable');
        } finally {
            setLoading(false);
        }
    }, [commandeId, id]);

    useEffect(() => {
        void loadCommande();
    }, [loadCommande]);

    // ============================================================
    // Charger paiements + reste à payer
    // ============================================================
    const loadPaiements = useCallback(async (): Promise<void> => {
        // ⚠️ GUARD
        if (!commandeId || Number.isNaN(commandeId)) return;
        try {
            const [list, r] = await Promise.all([
                paiementService.getByCommande(commandeId),
                paiementService.getResteAPayer(commandeId),
            ]);
            setPaiements(list);
            setReste(r);
        } catch (err) {
            console.warn('Erreur de chargement des paiements', err);
        }
    }, [commandeId]);

    useEffect(() => {
        void loadPaiements();
    }, [loadPaiements]);

    // ============================================================
    // Charger retours
    // ============================================================
    const loadRetours = useCallback(async (): Promise<void> => {
        // ⚠️ GUARD
        if (!commandeId || Number.isNaN(commandeId)) return;
        try {
            const list = await retourService.getByCommande(commandeId);
            setRetours(list);
        } catch (err) {
            console.warn('Erreur de chargement des retours', err);
        }
    }, [commandeId]);

    useEffect(() => {
        void loadRetours();
    }, [loadRetours]);

    // ============================================================
    // Actions commande
    // ============================================================
    const handleChangerStatut = async (nouveauStatut: StatutCommande): Promise<void> => {
        if (!commande) return;
        if (!confirm(`Passer la commande à "${nouveauStatut}" ?`)) return;

        try {
            setActionLoading(true);
            const updated = await commandeService.changerStatut(commande.id, nouveauStatut);
            setCommande(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!commande) return;
        if (!confirm(`Supprimer définitivement la commande ${commande.numero} ?`)) return;

        try {
            await commandeService.deleteCommande(commande.id);
            navigate(basePath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Actions paiement
    // ============================================================
    const openPaiementModal = (): void => {
        setPaiementForm({
            montant: reste?.resteAPayer ?? commande?.totalTTC ?? 0,
            methode: 'ESPECES',
            reference: '',
            notes: '',
        });
        setIsPaiementModalOpen(true);
    };

    const closePaiementModal = (): void => {
        setIsPaiementModalOpen(false);
    };

    const handleCreatePaiement = async (): Promise<void> => {
        if (!commande) return;
        if (paiementForm.montant <= 0) {
            alert('Le montant doit être supérieur à 0');
            return;
        }
        if (reste && paiementForm.montant > reste.resteAPayer) {
            alert(
                `Le montant dépasse le reste à payer (${reste.resteAPayer.toLocaleString(
                    'fr-FR'
                )} FCFA)`
            );
            return;
        }

        try {
            setPaiementSubmitting(true);
            await paiementService.createPaiement({
                commandeId: commande.id,
                montant: paiementForm.montant,
                methode: paiementForm.methode,
                reference: paiementForm.reference.trim() || undefined,
                notes: paiementForm.notes.trim() || undefined,
            });
            closePaiementModal();
            await Promise.all([loadCommande(), loadPaiements()]);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setPaiementSubmitting(false);
        }
    };

    // ============================================================
    // Rendu — loading / error
    // ============================================================
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => navigate(basePath)}
                        className="mt-4 text-sm text-red-700 underline"
                    >
                        Retour aux commandes
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) return null;

    const statut = getStatutOption(commande.statut);
    const transitions = TRANSITIONS_AUTORISEES[commande.statut];
    const etatSolde = getEtatSolde(reste);
    const soldeInfo = ETAT_SOLDE_LABELS[etatSolde];

    // Calcul des quantités déjà retournées par produit
    const quantitesRetournees = new Map<number, number>();
    retours.forEach((r) => {
        if (r.statut === 'REFUSE') return;
        r.lignes.forEach((l) => {
            quantitesRetournees.set(
                l.produitId,
                (quantitesRetournees.get(l.produitId) || 0) + l.quantite
            );
        });
    });

    const peutFaireRetour =
        commande.statut === 'LIVREE' &&
        commande.lignes.some(
            (l) => (quantitesRetournees.get(l.produitId) || 0) < l.quantite
        );

    return (
        <div className="p-8">
            {/* Retour */}
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux commandes
            </button>

            {/* En-tête */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900">{commande.numero}</h1>
                        <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statut.color}`}
                        >
                            {statut.label}
                        </span>
                        {reste && (
                            <span
                                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${soldeInfo.color}`}
                            >
                                {soldeInfo.label}
                            </span>
                        )}
                        {retours.length > 0 && (
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                {retours.length} retour{retours.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Créée le{' '}
                        {new Date(commande.dateCommande).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>

                {/* Actions */}
                {canEdit && (
                    <div className="flex flex-wrap gap-2">
                        {commande.statut === 'EN_ATTENTE' && (
                            <Button
                                variant="secondary"
                                icon={<PencilSquareIcon className="h-4 w-4" />}
                                onClick={() => navigate(`${basePath}?edit=${commande.id}`)}
                            >
                                Modifier
                            </Button>
                        )}

                        {transitions.map((t) => (
                            <Button
                                key={t}
                                variant={t === 'ANNULEE' ? 'danger' : 'primary'}
                                onClick={() => handleChangerStatut(t)}
                                loading={actionLoading}
                                icon={
                                    t === 'VALIDEE' ? (
                                        <CheckCircleIcon className="h-4 w-4" />
                                    ) : t === 'LIVREE' ? (
                                        <TruckIcon className="h-4 w-4" />
                                    ) : t === 'ANNULEE' ? (
                                        <XCircleIcon className="h-4 w-4" />
                                    ) : undefined
                                }
                            >
                                {t === 'VALIDEE' && 'Valider'}
                                {t === 'EN_COURS' && 'Démarrer'}
                                {t === 'LIVREE' && 'Marquer livrée'}
                                {t === 'ANNULEE' && 'Annuler'}
                            </Button>
                        ))}

                        {canDelete &&
                            (commande.statut === 'EN_ATTENTE' ||
                                commande.statut === 'VALIDEE') && (
                                <Button
                                    variant="danger"
                                    icon={<TrashIcon className="h-4 w-4" />}
                                    onClick={handleDelete}
                                >
                                    Supprimer
                                </Button>
                            )}
                    </div>
                )}
            </div>

            {/* 2 colonnes : client + totaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {commande.client && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                            Client
                        </h2>
                        <p className="text-lg font-semibold text-gray-900">
                            {commande.client.prenom} {commande.client.nom}
                        </p>
                        <p className="text-sm text-gray-600">{commande.client.email}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                        Totaux
                    </h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total HT</span>
                            <span className="font-medium">
                                {commande.totalHT.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                TVA ({commande.tvaPercent}%)
                            </span>
                            <span className="font-medium">
                                {(commande.totalTTC - commande.totalHT).toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                            <span>Total TTC</span>
                            <span className="text-primary-600">
                                {commande.totalTTC.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {commande.notes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Notes
                    </h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{commande.notes}</p>
                </div>
            )}

            {/* Lignes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Lignes ({commande.lignes.length})
                    </h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Produit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Prix unitaire
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Quantité
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Retourné
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Sous-total
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {commande.lignes.map((l) => {
                        const dejaRetourne = quantitesRetournees.get(l.produitId) || 0;
                        const restant = l.quantite - dejaRetourne;

                        return (
                            <tr key={l.id}>
                                <td className="px-6 py-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {l.produitNom}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        {l.produitReference}
                                    </p>
                                </td>
                                <td className="px-6 py-3 text-right text-sm text-gray-700">
                                    {l.prixUnitaire.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="px-6 py-3 text-center text-sm font-medium">
                                    {l.quantite}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {dejaRetourne > 0 ? (
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                restant === 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}
                                        >
                                            {dejaRetourne}
                                            {restant === 0 ? ' (tout)' : ` / ${l.quantite}`}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                    {l.sousTotal.toLocaleString('fr-FR')} FCFA
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Paiements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5 text-primary-600" />
                        Paiements ({paiements.length})
                    </h2>

                    {canEdit && reste && !reste.solde && commande.statut !== 'ANNULEE' && (
                        <Button
                            size="sm"
                            icon={<PlusIcon className="h-4 w-4" />}
                            onClick={openPaiementModal}
                        >
                            Enregistrer un paiement
                        </Button>
                    )}
                </div>

                {reste && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Total TTC
                                </p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                    {reste.totalTTC.toLocaleString('fr-FR')} FCFA
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Déjà payé
                                </p>
                                <p className="text-lg font-bold text-green-600 mt-1">
                                    {reste.totalPaye.toLocaleString('fr-FR')} FCFA
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Reste à payer
                                </p>
                                <p
                                    className={`text-lg font-bold mt-1 ${
                                        reste.solde ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    {reste.resteAPayer.toLocaleString('fr-FR')} FCFA
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{
                                        width: `${
                                            reste.totalTTC > 0
                                                ? Math.min(
                                                    100,
                                                    (reste.totalPaye / reste.totalTTC) * 100
                                                )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {reste.totalTTC > 0
                                    ? Math.round((reste.totalPaye / reste.totalTTC) * 100)
                                    : 0}
                                % payé
                            </p>
                        </div>
                    </>
                )}

                {paiements.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-6 text-center">
                        Aucun paiement enregistré
                    </p>
                ) : (
                    <div className="space-y-2">
                        {paiements.map((p) => {
                            const pStatut = getStatutPaiementOption(p.statut);
                            const methode = getMethodeOption(p.methode);

                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                                        {methode.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-mono font-medium text-gray-900">
                                                {p.numero}
                                            </span>
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pStatut.color}`}
                                            >
                                                {pStatut.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {methode.label}
                                            {p.reference && ` • Réf : ${p.reference}`}
                                            {' • '}
                                            {new Date(p.datePaiement).toLocaleDateString(
                                                'fr-FR'
                                            )}
                                        </p>
                                        {p.notes && (
                                            <p className="text-xs text-gray-400 mt-1 italic">
                                                {p.notes}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {p.montant.toLocaleString('fr-FR')} FCFA
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Retours */}
            {(retours.length > 0 || peutFaireRetour) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ArrowUturnLeftIcon className="h-5 w-5 text-orange-600" />
                            Retours ({retours.length})
                        </h2>

                        {canEdit && peutFaireRetour && (
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={<PlusIcon className="h-4 w-4" />}
                                onClick={() =>
                                    navigate(
                                        isInspection
                                            ? `/dashboard/users/${userId}/retours/nouveau?commandeId=${commande.id}`
                                            : `/dashboard/retours/nouveau?commandeId=${commande.id}`
                                    )
                                }
                            >
                                Demander un retour
                            </Button>
                        )}
                    </div>

                    {retours.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-4 text-center">
                            Aucun retour pour cette commande
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {retours.map((r) => {
                                const rStatut = getStatutRetourOption(r.statut);

                                return (
                                    <div
                                        key={r.id}
                                        onClick={() =>
                                            navigate(
                                                isInspection
                                                    ? `/dashboard/users/${userId}/retours/${r.id}`
                                                    : `/dashboard/retours/${r.id}`
                                            )
                                        }
                                        className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <ArrowUturnLeftIcon className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-mono font-medium text-gray-900">
                                                    {r.numero}
                                                </span>
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rStatut.color}`}
                                                >
                                                    {rStatut.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {r.lignes.length} ligne
                                                {r.lignes.length > 1 ? 's' : ''}
                                                {r.motif && ` • ${r.motif}`}
                                                {' • '}
                                                {new Date(r.dateDemande).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {r.montantTotal.toLocaleString('fr-FR')} FCFA
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Info facture pour LIVREE */}
            {commande.statut === 'LIVREE' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <DocumentTextIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-900">
                                Commande livrée
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                Vous pouvez maintenant générer une facture pour cette commande.
                                (Module factures à venir)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal paiement */}
            <Modal
                isOpen={isPaiementModalOpen}
                onClose={closePaiementModal}
                title="Enregistrer un paiement"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={closePaiementModal}>
                            Annuler
                        </Button>
                        <Button onClick={handleCreatePaiement} loading={paiementSubmitting}>
                            Enregistrer
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant (FCFA) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paiementForm.montant}
                            onChange={(e) =>
                                setPaiementForm({
                                    ...paiementForm,
                                    montant: Number(e.target.value) || 0,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {reste && (
                            <p className="mt-1 text-xs text-gray-500">
                                Reste à payer :{' '}
                                <strong>
                                    {reste.resteAPayer.toLocaleString('fr-FR')} FCFA
                                </strong>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Méthode *
                        </label>
                        <select
                            value={paiementForm.methode}
                            onChange={(e) =>
                                setPaiementForm({
                                    ...paiementForm,
                                    methode: e.target.value as MethodePaiement,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            {METHODES_PAIEMENT.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.icon} {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Référence
                        </label>
                        <input
                            type="text"
                            value={paiementForm.reference}
                            onChange={(e) =>
                                setPaiementForm({
                                    ...paiementForm,
                                    reference: e.target.value,
                                })
                            }
                            placeholder="Ex: numéro de transaction, n° chèque…"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={paiementForm.notes}
                            onChange={(e) =>
                                setPaiementForm({
                                    ...paiementForm,
                                    notes: e.target.value,
                                })
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}