import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PlusIcon,
    EyeIcon,
    TrashIcon,
    ShoppingBagIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import LignesCommandeAchatEditor, {
    type LigneAchatDraft,
} from '../../components/LignesCommandeAchatEditor';
import { useCommandesAchat } from '../../hooks/useCommandesAchat';
import { useFournisseurs } from '../../hooks/useFournisseurs';
import { useProduits } from '../../hooks/useProduits';
import { commandeAchatService } from '../../services/commandeAchatService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    STATUTS_ACHAT,
    getStatutAchatOption,
    type CommandeAchatResponse,
    type StatutAchat,
} from '../../types/commandeAchat';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function AchatsPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/achats`
        : '/dashboard/achats';

    const { commandes, loading, error, reload } = useCommandesAchat();
    const { fournisseurs } = useFournisseurs();
    const { produits } = useProduits();

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isUser = checkIsUser(roles);
    const isSeller = checkIsSeller(roles);
    const canEdit = (isUser || isSeller) && !isInspection;
    const canDelete = isUser && !isInspection;

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<CommandeAchatResponse | null>(null);

    // Formulaire
    const [fournisseurId, setFournisseurId] = useState<number | null>(null);
    const [tvaPercent, setTvaPercent] = useState(18);
    const [notes, setNotes] = useState('');
    const [dateReceptionPrevue, setDateReceptionPrevue] = useState('');
    const [lignes, setLignes] = useState<LigneAchatDraft[]>([
        { produitId: null, quantite: 1, prixAchatUnitaire: 0 },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { reload: reloadProduits } = useProduits();


    // Filtres
    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutAchat | ''>('');

    // ============================================================
    // Totaux
    // ============================================================
    const totalHT = useMemo(
        () =>
            lignes.reduce(
                (sum, l) => sum + (l.produitId ? l.prixAchatUnitaire * l.quantite : 0),
                0
            ),
        [lignes]
    );
    const tvaMontant = useMemo(() => (totalHT * tvaPercent) / 100, [totalHT, tvaPercent]);
    const totalTTC = useMemo(() => totalHT + tvaMontant, [totalHT, tvaMontant]);

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return commandes.filter((c) => {
            const matchSearch =
                !search ||
                c.numero.toLowerCase().includes(search.toLowerCase()) ||
                (c.fournisseur &&
                    c.fournisseur.nom.toLowerCase().includes(search.toLowerCase()));

            const matchStatut = !statutFilter || c.statut === statutFilter;
            return matchSearch && matchStatut;
        });
    }, [commandes, search, statutFilter]);

    const totals = useMemo(() => {
        const total = filtered.length;
        const totalTTC = filtered
            .filter((c) => c.statut !== 'ANNULEE')
            .reduce((sum, c) => sum + c.totalTTC, 0);
        return { total, totalTTC };
    }, [filtered]);

    // ============================================================
    // Actions
    // ============================================================
    const openCreateModal = () => {
        setEditing(null);
        setFournisseurId(null);
        setTvaPercent(18);
        setNotes('');
        setDateReceptionPrevue('');
        setLignes([{ produitId: null, quantite: 1, prixAchatUnitaire: 0 }]);
        setIsModalOpen(true);
    };

    const openEditModal = (c: CommandeAchatResponse) => {
        setEditing(c);
        setFournisseurId(c.fournisseur?.id ?? null);
        setTvaPercent(c.tvaPercent);
        setNotes(c.notes || '');
        setDateReceptionPrevue(c.dateReceptionPrevue || '');
        setLignes(
            c.lignes.map((l) => ({
                produitId: l.produitId,
                quantite: l.quantite,
                prixAchatUnitaire: l.prixAchatUnitaire,
            }))
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const onSubmit = async (): Promise<void> => {
        if (!fournisseurId) {
            alert('Sélectionnez un fournisseur');
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
                fournisseurId,
                tvaPercent,
                notes: notes.trim() || undefined,
                dateReceptionPrevue: dateReceptionPrevue || undefined,
                lignes: lignesValides.map((l) => ({
                    produitId: l.produitId as number,
                    quantite: l.quantite,
                    prixAchatUnitaire: l.prixAchatUnitaire,
                })),
            };

            if (editing) {
                await commandeAchatService.updateCommandeAchat(editing.id, payload);
            } else {
                await commandeAchatService.createCommandeAchat(payload);
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

    const handleDelete = async (c: CommandeAchatResponse): Promise<void> => {
        const ok = confirm(`Supprimer la commande ${c.numero} ?`);
        if (!ok) return;
        try {
            await commandeAchatService.deleteCommandeAchat(c.id);
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
                title="Commandes d'achat"
                subtitle={
                    isInspection
                        ? 'Achats de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Achetez auprès de vos fournisseurs'
                            : 'Commandes d\'achat'
                }
                actions={
                    canEdit ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouvelle commande d'achat
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
                                placeholder="Rechercher par numéro ou fournisseur…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={statutFilter}
                            onChange={(e) => setStatutFilter(e.target.value as StatutAchat | '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les statuts</option>
                            {STATUTS_ACHAT.map((s) => (
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
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            Total (hors annulées) : {totals.totalTTC.toLocaleString('fr-FR')} FCFA
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
                        icon={<ShoppingBagIcon className="h-16 w-16" />}
                        title="Aucune commande d'achat"
                        description={
                            isInspection
                                ? "Cette entreprise n'a aucune commande d'achat."
                                : 'Commandez auprès de vos fournisseurs pour réapprovisionner votre stock.'
                        }
                        action={
                            canEdit ? (
                                <Button
                                    icon={<PlusIcon className="h-5 w-5" />}
                                    onClick={openCreateModal}
                                >
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
                                Fournisseur
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
                            const statut = getStatutAchatOption(c.statut);
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
                                            {c.fournisseur?.nom || '—'}
                                        </p>
                                        {c.fournisseur && (
                                            <p className="text-xs text-gray-500">
                                                {c.fournisseur.code}
                                            </p>
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
                                                    <ShoppingBagIcon className="h-4 w-4" />
                                                </button>
                                            )}

                                            {canDelete &&
                                                (c.statut === 'EN_ATTENTE' ||
                                                    c.statut === 'COMMANDEE') && (
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
                title={editing ? `Modifier ${editing.numero}` : 'Nouvelle commande d\'achat'}
                size="4xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button onClick={onSubmit} loading={isSubmitting}>
                            {editing ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fournisseur *
                        </label>
                        <select
                            value={fournisseurId || ''}
                            onChange={(e) =>
                                setFournisseurId(e.target.value ? Number(e.target.value) : null)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">-- Choisir un fournisseur --</option>
                            {fournisseurs
                                .filter((f) => f.actif)
                                .map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.nom} ({f.code})
                                    </option>
                                ))}
                        </select>
                    </div>

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
                                Réception prévue
                            </label>
                            <input
                                type="date"
                                value={dateReceptionPrevue}
                                onChange={(e) => setDateReceptionPrevue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Produits *
                        </label>
                        <LignesCommandeAchatEditor
                            lignes={lignes}
                            produits={produits.filter((p) => p.actif)}
                            onChange={setLignes}
                            onProduitCreated={() => {
                                void reloadProduits();
                            }}
                        />
                    </div>

                    {/* Totaux */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total HT</span>
                            <span className="font-medium">
                                {totalHT.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">TVA ({tvaPercent}%)</span>
                            <span className="font-medium">
                                {tvaMontant.toLocaleString('fr-FR')} FCFA
                            </span>
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