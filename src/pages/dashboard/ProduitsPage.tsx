import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    EyeIcon,
    CubeIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useProduits } from '../../hooks/useProduits';
import { useCategories } from '../../hooks/useCategories';
import { produitService } from '../../services/produitService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import { getFullUrl } from '../../utils/url';
import { getCategorieAndDescendants } from '../../utils/categories';
import type { ProduitResponse } from '../../types/produit';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Validation
// ============================================================

const produitSchema = z.object({
    reference: z.string().min(2, 'Min 2').max(50, 'Max 50'),
    nom: z.string().min(2, 'Min 2').max(150, 'Max 150'),
    description: z.string().max(1000, 'Max 1000').optional(),
    prix: z.number().min(0, 'Doit être positif'),
    prixAchat: z.number().min(0, 'Doit être positif'),
    stock: z.number().int().min(0, 'Doit être positif'),
    categorieId: z.number().nullable().optional(),
    actif: z.boolean(),
});

type ProduitForm = z.infer<typeof produitSchema>;

// ============================================================
// Composant
// ============================================================

export default function ProduitsPage() {
    const navigate = useNavigate();
    const { produits, loading, error, isInspection, reload } = useProduits();
    const { categories } = useCategories();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];

    const isUser = checkIsUser(roles);
    const isSeller = checkIsSeller(roles);

    const canEdit = (isUser || isSeller) && !isInspection;
    const canDelete = isUser && !isInspection;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduit, setEditingProduit] = useState<ProduitResponse | null>(null);
    const [search, setSearch] = useState('');
    const [categorieFilter, setCategorieFilter] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProduitForm>({
        resolver: zodResolver(produitSchema),
        defaultValues: {
            reference: '',
            nom: '',
            description: '',
            prix: 0,
            prixAchat: 0,
            stock: 0,
            categorieId: null,
            actif: true,
        },
    });

    // ============================================================
    // IDs des catégories sélectionnées + descendants
    // ⚠️ DOIT être déclaré AVANT `filtered`
    // ============================================================
    const selectedCategorieIds = useMemo(() => {
        if (!categorieFilter) return new Set<number>();
        return new Set(getCategorieAndDescendants(categorieFilter, categories));
    }, [categorieFilter, categories]);

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return produits.filter((p) => {
            const matchSearch =
                !search ||
                p.nom.toLowerCase().includes(search.toLowerCase()) ||
                p.reference.toLowerCase().includes(search.toLowerCase());

            const matchCategorie =
                !categorieFilter ||
                (p.categorieId !== null && selectedCategorieIds.has(p.categorieId));

            return matchSearch && matchCategorie;
        });
    }, [produits, search, categorieFilter, selectedCategorieIds]);

    // ============================================================
    // Totaux
    // ============================================================
    const totals = useMemo(() => {
        const valeurStock = filtered.reduce((sum, p) => sum + p.prix * p.stock, 0);
        const margePotentielle = filtered.reduce(
            (sum, p) => sum + (p.prix - p.prixAchat) * p.stock,
            0
        );
        return { valeurStock, margePotentielle };
    }, [filtered]);

    // ============================================================
    // Actions
    // ============================================================

    const onSubmit = async (data: ProduitForm): Promise<void> => {
        try {
            const payload = { ...data, categorieId: data.categorieId || undefined };
            if (editingProduit) {
                await produitService.updateProduit(editingProduit.id, payload);
            } else {
                await produitService.createProduit(payload);
            }
            closeModal();
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const openCreateModal = (): void => {
        setEditingProduit(null);
        reset({
            reference: '',
            nom: '',
            description: '',
            prix: 0,
            prixAchat: 0,
            stock: 0,
            categorieId: null,
            actif: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (p: ProduitResponse): void => {
        setEditingProduit(p);
        reset({
            reference: p.reference,
            nom: p.nom,
            description: p.description || '',
            prix: p.prix,
            prixAchat: p.prixAchat,
            stock: p.stock,
            categorieId: p.categorieId,
            actif: p.actif,
        });
        setIsModalOpen(true);
    };

    const closeModal = (): void => {
        setIsModalOpen(false);
        setEditingProduit(null);
        reset();
    };

    const handleDelete = async (p: ProduitResponse): Promise<void> => {
        const ok = confirm(`Supprimer le produit "${p.nom}" ?`);
        if (!ok) return;
        try {
            await produitService.deleteProduit(p.id);
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
                title="Produits"
                subtitle={
                    isInspection
                        ? 'Produits de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Catalogue de vos produits'
                            : 'Catalogue des produits'
                }
                actions={
                    canEdit ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouveau produit
                        </Button>
                    ) : undefined
                }
            />

            {/* Barre de filtres + indicateurs */}
            {!loading && produits.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou référence…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={categorieFilter || ''}
                            onChange={(e) =>
                                setCategorieFilter(e.target.value ? Number(e.target.value) : null)
                            }
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Toutes les catégories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.cheminComplet || c.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {filtered.length} produit{filtered.length > 1 ? 's' : ''}
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            Valeur stock : {totals.valeurStock.toLocaleString('fr-FR')} FCFA
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <ChartBarIcon className="h-4 w-4" />
                            Marge potentielle : {totals.margePotentielle.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : produits.length === 0 ? (
                    <EmptyState
                        icon={<CubeIcon className="h-16 w-16" />}
                        title="Aucun produit"
                        description={
                            isInspection
                                ? 'Cette entreprise n\'a aucun produit.'
                                : 'Commencez par créer votre premier produit.'
                        }
                        action={
                            canEdit ? (
                                <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                    Créer un produit
                                </Button>
                            ) : undefined
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun produit ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Photo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Produit
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Référence
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Prix
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Stock
                            </th>

                            {/* Colonne ACTIONS — uniquement hors inspection */}
                            {!isInspection && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                    Actions
                                </th>
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((p) => (
                            <tr
                                key={p.id}
                                className={`hover:bg-gray-50 ${isInspection ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (isInspection) {
                                        navigate(`/dashboard/produits/${p.id}`);
                                    }
                                }}
                            >
                                <td className="px-4 py-3">
                                    {p.photoPrincipale ? (
                                        <img
                                            src={getFullUrl(p.photoPrincipale)}
                                            alt={p.nom}
                                            className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <CubeIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">{p.nom}</p>
                                    <p className="text-xs text-gray-500">
                                        {p.categorieNom || 'Sans catégorie'}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{p.reference}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {p.prix.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            p.stock === 0
                                                ? 'bg-red-100 text-red-700'
                                                : p.stock < 10
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-green-100 text-green-700'
                                        }`}
                                    >
                                        {p.stock}
                                    </span>
                                </td>

                                {/* Cellule ACTIONS — uniquement hors inspection */}
                                {!isInspection && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/produits/${p.id}`);
                                                }}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Voir le détail"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>

                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(p);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                    title="Modifier"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(p);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProduit ? 'Modifier le produit' : 'Nouveau produit'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button type="submit" form="produit-form" loading={isSubmitting}>
                            {editingProduit ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <form id="produit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Référence *
                            </label>
                            <input
                                {...register('reference')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            {errors.reference && (
                                <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catégorie
                            </label>
                            <select
                                {...register('categorieId', {
                                    setValueAs: (v) => (v === '' ? null : Number(v)),
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Sans catégorie</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.cheminComplet || c.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                            {...register('nom')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix vente *
                            </label>
                            <input
                                {...register('prix', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix achat *
                            </label>
                            <input
                                {...register('prixAchat', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock *
                            </label>
                            <input
                                {...register('stock', { valueAsNumber: true })}
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="actif"
                            {...register('actif')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="actif" className="text-sm text-gray-700">
                            Produit actif
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
}