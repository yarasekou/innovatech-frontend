import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { clientService } from '../../services/clientService';
import { commandeService } from '../../services/commandeService';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin as checkIsAdmin } from '../../types/auth';
import { getStatutOption } from '../../types/commande';
import type { ClientResponse } from '../../types/client';
import type { CommandeResponse } from '../../types/commande';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function ClientDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const clientId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/clients`
        : '/dashboard/clients';

    const commandeBasePath = isInspection
        ? `/dashboard/users/${userId}/commandes`
        : '/dashboard/commandes';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isAdmin = checkIsAdmin(roles);

    const [client, setClient] = useState<ClientResponse | null>(null);
    const [commandes, setCommandes] = useState<CommandeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================================
    // Charger le client et ses commandes
    // ============================================================
    const loadData = useCallback(async (): Promise<void> => {
        if (!clientId || Number.isNaN(clientId)) {
            setError('Identifiant client invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [clientData, commandesData] = await Promise.all([
                clientService.getClientById(clientId),
                commandeService.getByClient(clientId),
            ]);

            setClient(clientData);
            setCommandes(commandesData);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Client introuvable');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // ============================================================
    // Calculs statistiques
    // ============================================================
    const totalCA = commandes
        .filter((c) => c.statut !== 'ANNULEE')
        .reduce((sum, c) => sum + c.totalTTC, 0);

    const commandesLivrees = commandes.filter((c) => c.statut === 'LIVREE').length;

    // ============================================================
    // Rendu
    // ============================================================
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl max-w-2xl mx-auto mt-10">
                <p>{error}</p>
                <button onClick={() => navigate(basePath)} className="mt-4 underline text-sm">
                    Retour aux clients
                </button>
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="p-8">
            {/* Retour */}
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux clients
            </button>

            {/* En-tête */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-700">
                            {client.prenom.charAt(0).toUpperCase()}
                            {client.nom.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {client.prenom} {client.nom}
                            </h1>
                            {!client.actif && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    Inactif
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Client depuis le{' '}
                            {new Date(client.dateCreation).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Infos client + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Coordonnées */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-4">Coordonnées</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">{client.telephone || 'Non renseigné'}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    {client.adresse && <p className="text-gray-900">{client.adresse}</p>}
                                    <p className="text-gray-500">
                                        {[client.ville, client.pays].filter(Boolean).join(', ') || 'Adresse non renseignée'}
                                    </p>
                                </div>
                            </div>
                            {client.siret && (
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-400 text-xs font-semibold">SIRET</span>
                                    <span className="text-gray-900 font-mono">{client.siret}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xs uppercase font-semibold text-gray-500 mb-4">Statistiques</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Total dépensé</p>
                            <p className="text-2xl font-bold text-green-600">
                                {totalCA.toLocaleString('fr-FR')} FCFA
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Commandes</p>
                            <p className="text-xl font-bold text-gray-900">
                                {commandes.length} <span className="text-sm font-normal text-gray-500">dont {commandesLivrees} livrée(s)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historique des commandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCartIcon className="h-5 w-5 text-primary-600" />
                        Historique des commandes
                    </h2>
                </div>

                {commandes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>Aucune commande pour ce client</p>
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
                        {commandes.map((c) => {
                            const statut = getStatutOption(c.statut);
                            return (
                                <tr
                                    key={c.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`${commandeBasePath}/${c.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono font-medium text-primary-600">
                                            {c.numero}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(c.dateCommande).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        {c.totalTTC.toLocaleString('fr-FR')} FCFA
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