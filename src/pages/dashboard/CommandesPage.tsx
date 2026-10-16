import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PlusIcon,
    EyeIcon,
    TrashIcon,
    ShoppingCartIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import LignesCommandeEditor, { type LigneDraft } from '../../components/LignesCommandeEditor';
import { useCommandes } from '../../hooks/useCommandes';
import { useClients } from '../../hooks/useClients';
import { useProduits } from '../../hooks/useProduits';
import { commandeService } from '../../services/commandeService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    STATUTS_COMMANDE,
    getStatutOption,
    type CommandeResponse,
    type StatutCommande,
} from '../../types/commande';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Composant
// ============================================================

export default function CommandesPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/commandes`
        : '/dashboard/commandes';

    const { commandes, loading, error, reload } = useCommandes();
    const { clients } = useClients();
    const { produits } = useProduits();

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isUser = checkIsUser(roles);
    const isSeller = checkIsSeller(roles);

    const canEdit = (isUser || isSeller) && !isInspection;
    const canDelete = isUser && !isInspection;

    // État modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCommande, setEditingCommande] = useState<CommandeResponse | null>(null);

    // Formulaire
    const [clientId, setClientId] = useState<number | null>(null);
    const [tvaPercent, setTvaPercent] = useState<number>(18);
    const [notes, setNotes] = useState('');
    const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState('');
    const [lignes, setLignes] = useState<LigneDraft[]>([{ produitId: null, quantite: 1 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtres
    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutCommande | ''>('');

    // ============================================================
    // Calculs
    // ============================================================
    const totalHT = useMemo(() => {
        return lignes.reduce((sum, l) => {
            if (!l.produitId) return sum;
            const produit = produits.find((p) => p.id === l.produitId);
            if (!produit) return sum;
            return sum + produit.prix * l.quantite;
        }, 0);
    }, [lignes, produits]);

    const tvaMontant = useMemo(
        () => (totalHT * tvaPercent) / 100,
        [totalHT, tvaPercent]
    );

    const totalTTC = useMemo(() => totalHT + tvaMontant, [totalHT, tvaMontant]);

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return commandes.filter((c) => {
            const matchSearch =
                !search ||
                c.numero.toLowerCase().includes(search.toLowerCase()) ||
                (c.client &&
                    (`${c.client.prenom} ${c.client.nom}`
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        c.client.email.toLowerCase().includes(search.toLowerCase())));

            const matchStatut = !statutFilter || c.statut === statutFilter;

            return matchSearch && matchStatut;
        });
    }, [commandes, search, statutFilter]);

    // Totaux
    const totals = useMemo(() => {
        const total = filtered.length;
        const totalTTC = filtered
            .filter((c) => c.statut !== 'ANNULEE')
            .reduce((sum, c) => sum + c.totalTTC, 0);
        return { total, totalTTC };
    }, [filtered]);

    // ============================================================
    // Actions modal
    // ============================================================
    const openCreateModal = () => {
        setEditingCommande(null);
        setClientId(null);
        setTvaPercent(18);
        setNotes('');
        setDateLivraisonPrevue('');
        setLignes([{ produitId: null, quantite: 1 }]);
        setIsModalOpen(true);
    };

    const openEditModal = (c: CommandeResponse) => {
        setEditingCommande(c);
        setClientId(c.client?.id ?? null);
        setTvaPercent(c.tvaPercent);
        setNotes(c.notes || '');
        setDateLivraisonPrevue(c.dateLivraisonPrevue || '');
        setLignes(
            c.lignes.map((l) => ({
                produitId: l.produitId,
                quantite: l.quantite,
            }))
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCommande(null);
    };

    const onSubmit = async () => {
        if (!clientId) {
            alert('Sélectionnez un client');
            return;
        }
        const lignesValides = lignes.filter((l) => l.produitId !== null);
        if (lignesValides.length === 0) {
            alert('Ajoutez au moins une ligne');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                clientId,
                tvaPercent,
                notes: notes.trim() || undefined,
                dateLivraisonPrevue: dateLivraisonPrevue || undefined,
                lignes: lignesValides.map((l) => ({
                    produitId: l.produitId as number,
                    quantite: l.quantite,
                })),
            };

            if (editingCommande) {
                await commandeService.updateCommande(editingCommande.id, payload);
            } else {
                await commandeService.createCommande(payload);
            }

            closeModal();
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (c: CommandeResponse) => {
        const ok = confirm(`Supprimer la commande ${c.numero} ?`);
        if (!ok) return;
        try {
            await commandeService.deleteCommande(c.id);
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
                title="Commandes"
                subtitle={
                    isInspection
                        ? 'Commandes de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Gérez vos commandes clients'
                            : 'Liste des commandes'
                }
                actions={
                    canEdit ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouvelle commande
                        </Button>
                    ) : undefined
                }
            />

            {/* Filtres */}
            {!loading && commandes.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par numéro ou client…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={statutFilter}
                            onChange={(e) => setStatutFilter(e.target.value as StatutCommande | '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les statuts</option>
                            {STATUTS_COMMANDE.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} commande{totals.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            CA (hors annulées) : {totals.totalTTC.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : commandes.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingCartIcon className="h-16 w-16" />}
                        title="Aucune commande"
                        description={
                            isInspection
                                ? "Cette entreprise n'a aucune commande."
                                : 'Commencez par créer votre première commande.'
                        }
                        action={
                            canEdit ? (
                                <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                    Créer une commande
                                </Button>
                            ) : undefined
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucune commande ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Numéro
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
                                Total TTC
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((c) => {
                            const statut = getStatutOption(c.statut);
                            return (
                                <tr
                                    key={c.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`${basePath}/${c.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            {c.numero}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900">
                                            {c.client
                                                ? `${c.client.prenom} ${c.client.nom}`
                                                : '—'}
                                        </p>
                                        {c.client && (
                                            <p className="text-xs text-gray-500">{c.client.email}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(c.dateCommande).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}
                                        >
                                            {statut.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        {c.totalTTC.toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`${basePath}/${c.id}`);
                                                }}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Voir"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>

                                            {canEdit && c.statut === 'EN_ATTENTE' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(c);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                    title="Modifier"
                                                >
                                                    <ShoppingCartIcon className="h-4 w-4" />
                                                </button>
                                            )}

                                            {canDelete &&
                                                (c.statut === 'EN_ATTENTE' ||
                                                    c.statut === 'VALIDEE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(c);
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

            {/* Modal création/édition */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCommande ? `Modifier ${editingCommande.numero}` : 'Nouvelle commande'}
                size="4xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button onClick={onSubmit} loading={isSubmitting}>
                            {editingCommande ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Client */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client *
                        </label>
                        <select
                            value={clientId || ''}
                            onChange={(e) =>
                                setClientId(e.target.value ? Number(e.target.value) : null)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">-- Choisir un client --</option>
                            {clients
                                .filter((c) => c.actif)
                                .map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.prenom} {c.nom} — {c.email}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* TVA + date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                TVA (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={tvaPercent}
                                onChange={(e) => setTvaPercent(Number(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Livraison prévue
                            </label>
                            <input
                                type="date"
                                value={dateLivraisonPrevue}
                                onChange={(e) => setDateLivraisonPrevue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Lignes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Produits *
                        </label>
                        <LignesCommandeEditor
                            lignes={lignes}
                            produits={produits.filter((p) => p.actif)}
                            onChange={setLignes}
                        />
                    </div>

                    {/* Totaux */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total HT</span>
                            <span className="font-medium">{totalHT.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">TVA ({tvaPercent}%)</span>
                            <span className="font-medium">{tvaMontant.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                            <span>Total TTC</span>
                            <span className="text-primary-600">
                                {totalTTC.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}