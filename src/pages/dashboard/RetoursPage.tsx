import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowUturnLeftIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CurrencyDollarIcon,
    EyeIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useRetours } from '../../hooks/useRetours';
import { retourService } from '../../services/retourService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    STATUTS_RETOUR,
    getStatutRetourOption,
    type RetourResponse,
    type StatutRetour,
} from '../../types/retour';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function RetoursPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/retours`
        : '/dashboard/retours';

    const { retours, loading, error, reload } = useRetours();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isUser = checkIsUser(roles);
    checkIsSeller(roles);
    const canDelete = isUser && !isInspection;

    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutRetour | ''>('');

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return retours.filter((r) => {
            const matchSearch =
                !search ||
                r.numero.toLowerCase().includes(search.toLowerCase()) ||
                (r.commandeNumero &&
                    r.commandeNumero.toLowerCase().includes(search.toLowerCase())) ||
                (r.clientNom &&
                    r.clientNom.toLowerCase().includes(search.toLowerCase())) ||
                (r.clientPrenom &&
                    r.clientPrenom.toLowerCase().includes(search.toLowerCase()));

            const matchStatut = !statutFilter || r.statut === statutFilter;

            return matchSearch && matchStatut;
        });
    }, [retours, search, statutFilter]);

    // ============================================================
    // Totaux
    // ============================================================
    const totals = useMemo(() => {
        const total = filtered.length;
        const montantTotal = filtered
            .filter((r) => r.statut !== 'REFUSE')
            .reduce((sum, r) => sum + r.montantTotal, 0);
        return { total, montantTotal };
    }, [filtered]);

    // ============================================================
    // Actions
    // ============================================================
    const handleDelete = async (r: RetourResponse): Promise<void> => {
        const ok = confirm(`Supprimer le retour ${r.numero} ?`);
        if (!ok) return;
        try {
            await retourService.deleteRetour(r.id);
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Rendu
    // ============================================================
    return (
        <div className="p-8">
            <PageHeader
                title="Retours"
                subtitle={
                    isInspection
                        ? 'Retours de cette entreprise (lecture seule)'
                        : 'Gérez les retours clients'
                }
            />

            {/* Filtres */}
            {!loading && retours.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par numéro, commande ou client…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={statutFilter}
                            onChange={(e) => setStatutFilter(e.target.value as StatutRetour | '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les statuts</option>
                            {STATUTS_RETOUR.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} retour{totals.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            Montant : {totals.montantTotal.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : retours.length === 0 ? (
                    <EmptyState
                        icon={<ArrowUturnLeftIcon className="h-16 w-16" />}
                        title="Aucun retour"
                        description={
                            isInspection
                                ? "Cette entreprise n'a aucun retour."
                                : 'Les retours clients apparaîtront ici.'
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun retour ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Numéro
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Commande
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Client
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Statut
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Montant
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((r) => {
                            const statut = getStatutRetourOption(r.statut);
                            return (
                                <tr
                                    key={r.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`${basePath}/${r.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            {r.numero}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {r.commandeNumero || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900">
                                            {r.clientPrenom && r.clientNom
                                                ? `${r.clientPrenom} ${r.clientNom}`
                                                : '—'}
                                        </p>
                                        {r.clientEmail && (
                                            <p className="text-xs text-gray-500">
                                                {r.clientEmail}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(r.dateDemande).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}
                                        >
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        {r.montantTotal.toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`${basePath}/${r.id}`);
                                                }}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Voir"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            {canDelete &&
                                                (r.statut === 'DEMANDE' ||
                                                    r.statut === 'REFUSE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(r);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Supprimer"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                        </div>
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