import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    InboxArrowDownIcon,
    TruckIcon,
    ShoppingBagIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { commandeAchatService } from '../../services/commandeAchatService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    getStatutAchatOption,
    TRANSITIONS_ACHAT,
    type CommandeAchatResponse,
    type StatutAchat,
} from '../../types/commandeAchat';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function AchatDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const achatId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/achats`
        : '/dashboard/achats';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;
    const canDelete = checkIsUser(roles) && !isInspection;

    const [commande, setCommande] = useState<CommandeAchatResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadCommande = useCallback(async (): Promise<void> => {
        if (!id || Number.isNaN(achatId)) {
            setError('Identifiant invalide');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await commandeAchatService.getCommandeAchatById(achatId);
            setCommande(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Commande introuvable');
        } finally {
            setLoading(false);
        }
    }, [achatId, id]);

    useEffect(() => {
        void loadCommande();
    }, [loadCommande]);

    const handleChangerStatut = async (nouveauStatut: StatutAchat): Promise<void> => {
        if (!commande) return;

        let message = `Passer la commande à "${nouveauStatut}" ?`;
        if (nouveauStatut === 'RECUE') {
            message =
                '⚠️ Marquer comme REÇUE va AUGMENTER le stock des produits.\n\nContinuer ?';
        } else if (nouveauStatut === 'ANNULEE') {
            message = '⚠️ Annuler cette commande va RESTITUER le stock.\n\nContinuer ?';
        }

        if (!confirm(message)) return;

        try {
            setActionLoading(true);
            const updated = await commandeAchatService.changerStatut(commande.id, nouveauStatut);
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
            await commandeAchatService.deleteCommandeAchat(commande.id);
            navigate(basePath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

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
                        Retour aux achats
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) return null;

    const statut = getStatutAchatOption(commande.statut);
    const transitions = TRANSITIONS_ACHAT[commande.statut];

    return (
        <div className="p-8">
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux achats
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
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Commandée le{' '}
                        {new Date(commande.dateCommande).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>

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
                                    t === 'COMMANDEE' ? (
                                        <TruckIcon className="h-4 w-4" />
                                    ) : t === 'RECUE' ? (
                                        <CheckCircleIcon className="h-4 w-4" />
                                    ) : t === 'RECU_PARTIEL' ? (
                                        <InboxArrowDownIcon className="h-4 w-4" />
                                    ) : t === 'ANNULEE' ? (
                                        <XCircleIcon className="h-4 w-4" />
                                    ) : undefined
                                }
                            >
                                {t === 'COMMANDEE' && 'Commander'}
                                {t === 'RECU_PARTIEL' && 'Reçu partiel'}
                                {t === 'RECUE' && 'Reçue'}
                                {t === 'ANNULEE' && 'Annuler'}
                            </Button>
                        ))}

                        {canDelete &&
                            (commande.statut === 'EN_ATTENTE' ||
                                commande.statut === 'COMMANDEE') && (
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

            {/* Fournisseur + Totaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {commande.fournisseur && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                            Fournisseur
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <TruckIcon className="h-5 w-5 text-primary-700" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {commande.fournisseur.nom}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {commande.fournisseur.code} · {commande.fournisseur.email}
                                </p>
                            </div>
                        </div>
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
                            <span className="text-gray-600">TVA ({commande.tvaPercent}%)</span>
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

            {/* Dates */}
            {(commande.dateReceptionPrevue || commande.notes) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {commande.dateReceptionPrevue && (
                            <div>
                                <p className="text-xs uppercase font-semibold text-gray-500">
                                    Réception prévue
                                </p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {new Date(commande.dateReceptionPrevue).toLocaleDateString(
                                        'fr-FR',
                                        {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        }
                                    )}
                                </p>
                            </div>
                        )}
                        {commande.notes && (
                            <div>
                                <p className="text-xs uppercase font-semibold text-gray-500">
                                    Notes
                                </p>
                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                                    {commande.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lignes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ShoppingBagIcon className="h-5 w-5 text-primary-600" />
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
                            Prix d'achat
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
                    {commande.lignes.map((l) => (
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
                                {l.prixAchatUnitaire.toLocaleString('fr-FR')} FCFA
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

            {/* Info impact stock */}
            {commande.statut === 'RECUE' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-900">
                                Commande reçue — stock augmenté
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                Les produits ont été ajoutés au stock principal et au stock
                                fournisseur.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {commande.statut === 'COMMANDEE' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">
                                En attente de réception
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Quand vous recevrez la marchandise, cliquez sur{' '}
                                <strong>"Reçue"</strong> pour augmenter le stock automatiquement.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}