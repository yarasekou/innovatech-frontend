import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    InboxArrowDownIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { retourService } from '../../services/retourService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    getStatutRetourOption,
    TRANSITIONS_RETOUR,
    type RetourResponse,
    type StatutRetour,
} from '../../types/retour';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function RetourDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const retourId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/retours`
        : '/dashboard/retours';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;
    const canDelete = checkIsUser(roles) && !isInspection;

    const [retour, setRetour] = useState<RetourResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // ============================================================
    // Charger
    // ============================================================
    const loadRetour = useCallback(async (): Promise<void> => {
        // ⚠️ GUARD : identifiant invalide (NaN)
        if (!id || Number.isNaN(retourId)) {
            setError('Identifiant de retour invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await retourService.getRetourById(retourId);
            setRetour(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Retour introuvable');
        } finally {
            setLoading(false);
        }
    }, [retourId, id]);

    useEffect(() => {
        void loadRetour();
    }, [loadRetour]);

    // ============================================================
    // Actions
    // ============================================================
    const handleChangerStatut = async (nouveauStatut: StatutRetour): Promise<void> => {
        if (!retour) return;
        if (!confirm(`Passer le retour à "${nouveauStatut}" ?`)) return;

        try {
            setActionLoading(true);
            const updated = await retourService.changerStatut(retour.id, nouveauStatut);
            setRetour(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!retour) return;
        if (!confirm(`Supprimer définitivement le retour ${retour.numero} ?`)) return;

        try {
            await retourService.deleteRetour(retour.id);
            navigate(basePath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Rendu
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
                        Retour aux retours
                    </button>
                </div>
            </div>
        );
    }

    if (!retour) return null;

    const statut = getStatutRetourOption(retour.statut);
    const transitions = TRANSITIONS_RETOUR[retour.statut];

    return (
        <div className="p-8">
            {/* Retour */}
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux retours
            </button>

            {/* En-tête */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900">{retour.numero}</h1>
                        <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statut.color}`}
                        >
                            {statut.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Demandé le{' '}
                        {new Date(retour.dateDemande).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>

                {canEdit && (
                    <div className="flex flex-wrap gap-2">
                        {transitions.map((t) => (
                            <Button
                                key={t}
                                variant={t === 'REFUSE' ? 'danger' : 'primary'}
                                onClick={() => handleChangerStatut(t)}
                                loading={actionLoading}
                                icon={
                                    t === 'ACCEPTE' ? (
                                        <CheckCircleIcon className="h-4 w-4" />
                                    ) : t === 'REFUSE' ? (
                                        <XCircleIcon className="h-4 w-4" />
                                    ) : t === 'RECU' ? (
                                        <InboxArrowDownIcon className="h-4 w-4" />
                                    ) : t === 'REMBOURSE' ? (
                                        <BanknotesIcon className="h-4 w-4" />
                                    ) : undefined
                                }
                            >
                                {t === 'ACCEPTE' && 'Accepter'}
                                {t === 'REFUSE' && 'Refuser'}
                                {t === 'RECU' && 'Marquer reçu'}
                                {t === 'REMBOURSE' && 'Rembourser'}
                            </Button>
                        ))}

                        {canDelete &&
                            (retour.statut === 'DEMANDE' || retour.statut === 'REFUSE') && (
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

            {/* 2 colonnes : client + commande */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(retour.clientNom || retour.clientPrenom) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                            Client
                        </h2>
                        <p className="text-lg font-semibold text-gray-900">
                            {retour.clientPrenom} {retour.clientNom}
                        </p>
                        {retour.clientEmail && (
                            <p className="text-sm text-gray-600">{retour.clientEmail}</p>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                        Commande liée
                    </h2>
                    {retour.commandeNumero && retour.commandeId ? (
                        <button
                            onClick={() => {
                                const cmdPath = isInspection
                                    ? `/dashboard/users/${userId}/commandes/${retour.commandeId}`
                                    : `/dashboard/commandes/${retour.commandeId}`;
                                navigate(cmdPath);
                            }}
                            className="text-lg font-semibold text-primary-600 hover:underline"
                        >
                            {retour.commandeNumero}
                        </button>
                    ) : (
                        <p className="text-sm text-gray-400">—</p>
                    )}
                </div>
            </div>

            {/* Motif + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {retour.motif && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                            Motif
                        </h2>
                        <p className="text-sm text-gray-700">{retour.motif}</p>
                    </div>
                )}
                {retour.notes && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                            Notes
                        </h2>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {retour.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Lignes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Lignes retournées ({retour.lignes.length})
                    </h2>
                    <div className="text-right">
                        <p className="text-xs uppercase font-semibold text-gray-500">
                            Montant total
                        </p>
                        <p className="text-xl font-bold text-primary-600">
                            {retour.montantTotal.toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>
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
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Sous-total
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {retour.lignes.map((l) => (
                        <tr key={l.id}>
                            <td className="px-6 py-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {l.produitNom}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                    {l.produitReference}
                                </p>
                                {l.raison && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        ⚠️ {l.raison}
                                    </p>
                                )}
                            </td>
                            <td className="px-6 py-3 text-right text-sm text-gray-700">
                                {l.prixUnitaire.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="px-6 py-3 text-center text-sm font-medium">
                                {l.quantite}
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                {l.sousTotal.toLocaleString('fr-FR')} FCFA
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Info statut RECU */}
            {retour.statut === 'RECU' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                        <InboxArrowDownIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-indigo-900">
                                Retour reçu — stock restitué
                            </p>
                            <p className="text-sm text-indigo-700 mt-1">
                                Les produits retournés ont été réintégrés dans le stock.
                                Vous pouvez maintenant procéder au remboursement.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info statut REMBOURSE */}
            {retour.statut === 'REMBOURSE' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-900">
                                Retour terminé
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                Le retour a été remboursé et clôturé.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info statut REFUSE */}
            {retour.statut === 'REFUSE' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-900">
                                Retour refusé
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                                Le retour a été refusé. Le motif est consultable ci-dessus.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}