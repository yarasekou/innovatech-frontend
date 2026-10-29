import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    TruckIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fournisseurService } from '../../services/fournisseurService';
import { commandeAchatService } from '../../services/commandeAchatService';
import { getStatutAchatOption } from '../../types/commandeAchat';
import type { FournisseurResponse } from '../../types/fournisseur';
import type { CommandeAchatResponse } from '../../types/commandeAchat';

export default function FournisseurDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const fournisseurId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/fournisseurs`
        : '/dashboard/fournisseurs';

    const achatBasePath = isInspection
        ? `/dashboard/users/${userId}/achats`
        : '/dashboard/achats';

    const [fournisseur, setFournisseur] = useState<FournisseurResponse | null>(null);
    const [achats, setAchats] = useState<CommandeAchatResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (): Promise<void> => {
        if (!fournisseurId || Number.isNaN(fournisseurId)) {
            setError('Identifiant fournisseur invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Charger le fournisseur
            const data = await fournisseurService.getFournisseurById(fournisseurId);
            setFournisseur(data);

            // 2. Charger ses achats (si ton backend a un endpoint pour ça)
            // Si tu n'as pas la route directe, on peut récupérer tous les achats et filtrer.
            const allAchats = await commandeAchatService.getCommandesAchat();
            setAchats(allAchats.filter(a => a.fournisseur?.id === fournisseurId));

        } catch (err: any) {
            setError(err.response?.data?.message || 'Fournisseur introuvable');
        } finally {
            setLoading(false);
        }
    }, [fournisseurId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!fournisseur) return null;

    // Calcul du total dépensé chez ce fournisseur
    const totalAchats = achats
        .filter(a => a.statut !== 'ANNULEE')
        .reduce((sum, a) => sum + a.totalTTC, 0);

    return (
        <div className="p-8">
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux fournisseurs
            </button>

            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <TruckIcon className="h-8 w-8 text-primary-700" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {fournisseur.nom}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Code : {fournisseur.code}
                            {!fournisseur.actif && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Inactif</span>}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-4">Coordonnées</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">{fournisseur.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">{fournisseur.telephone || 'Non renseigné'}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    {fournisseur.adresse && <p className="text-gray-900">{fournisseur.adresse}</p>}
                                    <p className="text-gray-500">
                                        {[fournisseur.ville, fournisseur.pays].filter(Boolean).join(', ') || 'Adresse non renseignée'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-4">Statistiques</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Total des achats</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {totalAchats.toLocaleString('fr-FR')} FCFA
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Commandes d'achat</p>
                            <p className="text-xl font-bold text-gray-900">
                                {achats.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-primary-600" />
                        Historique des achats
                    </h2>
                </div>

                {achats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ShoppingBagIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>Aucun achat avec ce fournisseur</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total TTC</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {achats.map((a) => {
                            const statut = getStatutAchatOption(a.statut);
                            return (
                                <tr
                                    key={a.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`${achatBasePath}/${a.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono font-medium text-primary-600">
                                            {a.numero}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(a.dateCommande).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        {a.totalTTC.toLocaleString('fr-FR')} FCFA
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}