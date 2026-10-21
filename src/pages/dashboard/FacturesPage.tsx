import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CurrencyDollarIcon,
    EyeIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useFactures } from '../../hooks/useFactures';
import {
    STATUTS_FACTURE,
    getStatutFactureOption,
    type StatutFacture,
} from '../../types/facture';

export default function FacturesPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/factures`
        : '/dashboard/factures';

    const { factures, loading, error } = useFactures();

    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutFacture | ''>('');

    // ============================================================
    // Filtrage & Totaux
    // ============================================================
    const filtered = useMemo(() => {
        return factures.filter((f) => {
            const matchSearch =
                !search ||
                f.numero.toLowerCase().includes(search.toLowerCase()) ||
                (f.commandeNumero?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (f.clientNom?.toLowerCase().includes(search.toLowerCase()) ?? false);

            const matchStatut = !statutFilter || f.statut === statutFilter;

            return matchSearch && matchStatut;
        });
    }, [factures, search, statutFilter]);

    const totals = useMemo(() => {
        const total = filtered.length;
        const totalPaye = filtered
            .filter((f) => f.statut === 'PAYEE')
            .reduce((sum, f) => sum + f.totalTTC, 0);
        const totalEnRetard = filtered
            .filter((f) => f.statut === 'EN_RETARD')
            .reduce((sum, f) => sum + f.totalTTC, 0);
        return { total, totalPaye, totalEnRetard };
    }, [filtered]);

    return (
        <div className="p-8">
            <PageHeader
                title="Factures"
                subtitle={
                    isInspection
                        ? 'Factures de cette entreprise (lecture seule)'
                        : 'Gérez vos factures clients'
                }
            />

            {!loading && factures.length > 0 && (
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
                            onChange={(e) => setStatutFilter(e.target.value as StatutFacture | '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les statuts</option>
                            {STATUTS_FACTURE.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} facture{totals.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            Encaissé : {totals.totalPaye.toLocaleString('fr-FR')} FCFA
                        </div>
                        {totals.totalEnRetard > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium whitespace-nowrap">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                En retard : {totals.totalEnRetard.toLocaleString('fr-FR')} FCFA
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : factures.length === 0 ? (
                    <EmptyState
                        icon={<DocumentTextIcon className="h-16 w-16" />}
                        title="Aucune facture"
                        description={
                            isInspection
                                ? "Cette entreprise n'a aucune facture."
                                : 'Les factures se créent depuis une commande livrée.'
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucune facture ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Numéro</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date émission</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total TTC</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((f) => {
                            const statut = getStatutFactureOption(f.statut);
                            return (
                                <tr
                                    key={f.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`${basePath}/${f.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            {f.numero}
                                        </span>
                                        {f.commandeNumero && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Cmd : {f.commandeNumero}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900">{f.clientNom || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(f.dateEmission).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        {f.totalTTC.toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`${basePath}/${f.id}`);
                                            }}
                                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                            title="Voir"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
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