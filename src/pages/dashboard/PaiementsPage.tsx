import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { usePaiements } from '../../hooks/usePaiements';
import {
    STATUTS_PAIEMENT,
    getMethodeOption,
    getStatutPaiementOption,
    type StatutPaiement,
} from '../../types/paiement';

export default function PaiementsPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const isInspection = !!userId;
    const { paiements, loading, error } = usePaiements();

    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutPaiement | ''>('');

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return paiements.filter((p) => {
            const matchSearch =
                !search ||
                p.numero.toLowerCase().includes(search.toLowerCase()) ||
                (p.commandeNumero &&
                    p.commandeNumero.toLowerCase().includes(search.toLowerCase())) ||
                (p.reference &&
                    p.reference.toLowerCase().includes(search.toLowerCase()));

            const matchStatut = !statutFilter || p.statut === statutFilter;

            return matchSearch && matchStatut;
        });
    }, [paiements, search, statutFilter]);

    // ============================================================
    // Totaux
    // ============================================================
    const totals = useMemo(() => {
        const total = filtered.length;
        const totalMontant = filtered
            .filter((p) => p.statut === 'VALIDE')
            .reduce((sum, p) => sum + p.montant, 0);
        return { total, totalMontant };
    }, [filtered]);

    // ============================================================
    // Rendu
    // ============================================================
    return (
        <div className="p-8">
            <PageHeader
                title="Paiements"
                subtitle={
                    isInspection
                        ? 'Paiements de cette entreprise (lecture seule)'
                        : 'Suivi des paiements reçus'
                }
            />

            {/* Filtres */}
            {!loading && paiements.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par numéro, commande ou référence…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={statutFilter}
                            onChange={(e) => setStatutFilter(e.target.value as StatutPaiement | '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les statuts</option>
                            {STATUTS_PAIEMENT.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} paiement{totals.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            Total validé : {totals.totalMontant.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : paiements.length === 0 ? (
                    <EmptyState
                        icon={<DocumentTextIcon className="h-16 w-16" />}
                        title="Aucun paiement"
                        description={
                            isInspection
                                ? "Cette entreprise n'a aucun paiement."
                                : 'Les paiements apparaissent ici une fois enregistrés.'
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun paiement ne correspond à votre recherche.
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
                                Méthode
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
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((p) => {
                            const statut = getStatutPaiementOption(p.statut);
                            const methode = getMethodeOption(p.methode);

                            return (
                                <tr
                                    key={p.id}
                                    className={`hover:bg-gray-50 ${
                                        p.commandeId ? 'cursor-pointer' : ''
                                    }`}
                                    onClick={() => {
                                        if (p.commandeId) {
                                            navigate(
                                                isInspection
                                                    ? `/dashboard/users/${userId}/commandes/${p.commandeId}`
                                                    : `/dashboard/commandes/${p.commandeId}`
                                            );
                                        }
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            {p.numero}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {p.commandeNumero || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                                            <span>{methode.icon}</span>
                                            <span>{methode.label}</span>
                                        </span>
                                        {p.reference && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Réf : {p.reference}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}
                                        >
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        {p.montant.toLocaleString('fr-FR')} FCFA
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