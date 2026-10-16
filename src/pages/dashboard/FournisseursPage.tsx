import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    TruckIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useFournisseurs } from '../../hooks/useFournisseurs';
import { fournisseurService } from '../../services/fournisseurService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import type { FournisseurResponse } from '../../types/fournisseur';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Validation
// ============================================================

const fournisseurSchema = z.object({
    code: z.string().min(2, 'Min 2').max(50, 'Max 50'),
    nom: z.string().min(2, 'Min 2').max(150, 'Max 150'),
    email: z.string().email('Email invalide').max(150, 'Max 150'),
    telephone: z.string().max(20, 'Max 20').optional(),
    adresse: z.string().max(255, 'Max 255').optional(),
    ville: z.string().max(100, 'Max 100').optional(),
    pays: z.string().max(100, 'Max 100').optional(),
    siret: z.string().max(14, 'Max 14').optional(),
    contactNom: z.string().max(150, 'Max 150').optional(),
    actif: z.boolean(),
});

type FournisseurForm = z.infer<typeof fournisseurSchema>;

// ============================================================
// Composant
// ============================================================

export default function FournisseursPage() {
    const { fournisseurs, loading, error, isInspection, reload } = useFournisseurs();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];

    const isUser = checkIsUser(roles);
    const isSeller = checkIsSeller(roles);

    const canEdit = (isUser || isSeller) && !isInspection;
    const canDelete = isUser && !isInspection;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFournisseur, setEditingFournisseur] = useState<FournisseurResponse | null>(null);
    const [search, setSearch] = useState('');
    const [paysFilter, setPaysFilter] = useState<string>('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FournisseurForm>({
        resolver: zodResolver(fournisseurSchema),
        defaultValues: {
            code: '',
            nom: '',
            email: '',
            telephone: '',
            adresse: '',
            ville: '',
            pays: 'Sénégal',
            siret: '',
            contactNom: '',
            actif: true,
        },
    });

    // ============================================================
    // Pays uniques
    // ============================================================
    const pays = useMemo(() => {
        const set = new Set<string>();
        fournisseurs.forEach((f) => f.pays && set.add(f.pays));
        return Array.from(set).sort();
    }, [fournisseurs]);

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return fournisseurs.filter((f) => {
            const matchSearch =
                !search ||
                f.nom.toLowerCase().includes(search.toLowerCase()) ||
                f.code.toLowerCase().includes(search.toLowerCase()) ||
                f.email.toLowerCase().includes(search.toLowerCase()) ||
                (f.contactNom?.toLowerCase().includes(search.toLowerCase()) ?? false);

            const matchPays = !paysFilter || f.pays === paysFilter;

            return matchSearch && matchPays;
        });
    }, [fournisseurs, search, paysFilter]);

    // ============================================================
    // Totaux
    // ============================================================
    const totals = useMemo(() => {
        const total = filtered.length;
        const actifs = filtered.filter((f) => f.actif).length;
        return { total, actifs };
    }, [filtered]);

    // ============================================================
    // Actions
    // ============================================================

    const onSubmit = async (data: FournisseurForm): Promise<void> => {
        try {
            const payload = {
                ...data,
                telephone: data.telephone?.trim() || undefined,
                adresse: data.adresse?.trim() || undefined,
                ville: data.ville?.trim() || undefined,
                pays: data.pays?.trim() || undefined,
                siret: data.siret?.trim() || undefined,
                contactNom: data.contactNom?.trim() || undefined,
            };

            if (editingFournisseur) {
                await fournisseurService.updateFournisseur(editingFournisseur.id, payload);
            } else {
                await fournisseurService.createFournisseur(payload);
            }
            closeModal();
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const openCreateModal = (): void => {
        setEditingFournisseur(null);
        reset({
            code: '',
            nom: '',
            email: '',
            telephone: '',
            adresse: '',
            ville: '',
            pays: 'Sénégal',
            siret: '',
            contactNom: '',
            actif: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (f: FournisseurResponse): void => {
        setEditingFournisseur(f);
        reset({
            code: f.code,
            nom: f.nom,
            email: f.email,
            telephone: f.telephone || '',
            adresse: f.adresse || '',
            ville: f.ville || '',
            pays: f.pays || 'Sénégal',
            siret: f.siret || '',
            contactNom: f.contactNom || '',
            actif: f.actif,
        });
        setIsModalOpen(true);
    };

    const closeModal = (): void => {
        setIsModalOpen(false);
        setEditingFournisseur(null);
        reset();
    };

    const handleDelete = async (f: FournisseurResponse): Promise<void> => {
        const ok = confirm(`Supprimer le fournisseur "${f.nom}" ?`);
        if (!ok) return;
        try {
            await fournisseurService.deleteFournisseur(f.id);
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const handleToggleActif = async (f: FournisseurResponse): Promise<void> => {
        try {
            if (f.actif) {
                await fournisseurService.deactivateFournisseur(f.id);
            } else {
                await fournisseurService.updateFournisseur(f.id, {
                    code: f.code,
                    nom: f.nom,
                    email: f.email,
                    telephone: f.telephone || undefined,
                    adresse: f.adresse || undefined,
                    ville: f.ville || undefined,
                    pays: f.pays || undefined,
                    siret: f.siret || undefined,
                    contactNom: f.contactNom || undefined,
                    actif: true,
                });
            }
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
                title="Fournisseurs"
                subtitle={
                    isInspection
                        ? 'Fournisseurs de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Gérez vos fournisseurs'
                            : 'Liste des fournisseurs'
                }
                actions={
                    canEdit ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouveau fournisseur
                        </Button>
                    ) : undefined
                }
            />

            {/* Barre de filtres + indicateurs */}
            {!loading && fournisseurs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, code, email ou contact…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={paysFilter}
                            onChange={(e) => setPaysFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Tous les pays</option>
                            {pays.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} fournisseur{totals.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <CheckCircleIcon className="h-4 w-4" />
                            {totals.actifs} actif{totals.actifs > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : fournisseurs.length === 0 ? (
                    <EmptyState
                        icon={<TruckIcon className="h-16 w-16" />}
                        title="Aucun fournisseur"
                        description={
                            isInspection
                                ? 'Cette entreprise n\'a aucun fournisseur.'
                                : 'Commencez par créer votre premier fournisseur.'
                        }
                        action={
                            canEdit ? (
                                <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                    Créer un fournisseur
                                </Button>
                            ) : undefined
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun fournisseur ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Code
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Fournisseur
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Téléphone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Ville
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Statut
                            </th>
                            {!isInspection && canEdit && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                    Actions
                                </th>
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((f) => (
                            <tr key={f.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700">
                                        {f.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <TruckIcon className="h-5 w-5 text-primary-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {f.nom}
                                            </p>
                                            {f.contactNom && (
                                                <p className="text-xs text-gray-500">
                                                    Contact : {f.contactNom}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{f.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {f.telephone || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {f.ville || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {f.actif ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <XCircleIcon className="h-4 w-4" />
                                            Inactif
                                        </span>
                                    )}
                                </td>
                                {!isInspection && canEdit && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Activer / Désactiver */}
                                            <button
                                                onClick={() => handleToggleActif(f)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    f.actif
                                                        ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                                                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                                }`}
                                                title={f.actif ? 'Désactiver' : 'Activer'}
                                            >
                                                {f.actif ? (
                                                    <XCircleIcon className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                )}
                                            </button>

                                            {/* Modifier */}
                                            <button
                                                onClick={() => openEditModal(f)}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Modifier"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>

                                            {/* Supprimer — USER uniquement */}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(f)}
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
                title={editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                size="2xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button type="submit" form="fournisseur-form" loading={isSubmitting}>
                            {editingFournisseur ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <form id="fournisseur-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Code *
                            </label>
                            <input
                                {...register('code')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="FOUR-001"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom *
                            </label>
                            <input
                                {...register('nom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="TechDistrib"
                            />
                            {errors.nom && (
                                <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone
                            </label>
                            <input
                                {...register('telephone')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse
                        </label>
                        <input
                            {...register('adresse')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ville
                            </label>
                            <input
                                {...register('ville')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pays
                            </label>
                            <input
                                {...register('pays')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SIRET
                            </label>
                            <input
                                {...register('siret')}
                                maxLength={14}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du contact
                            </label>
                            <input
                                {...register('contactNom')}
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
                            Fournisseur actif
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
}