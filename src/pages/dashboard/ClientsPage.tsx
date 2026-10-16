import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    UserIcon,
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
import { useClients } from '../../hooks/useClients';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import type { ClientResponse } from '../../types/client';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Validation
// ============================================================

const clientSchema = z.object({
    nom: z.string().min(2, 'Min 2').max(100, 'Max 100'),
    prenom: z.string().min(2, 'Min 2').max(100, 'Max 100'),
    email: z.string().email('Email invalide').max(150, 'Max 150'),
    telephone: z.string().max(20, 'Max 20').optional(),
    adresse: z.string().max(255, 'Max 255').optional(),
    ville: z.string().max(100, 'Max 100').optional(),
    pays: z.string().max(100, 'Max 100').optional(),
    siret: z.string().max(14, 'Max 14').optional(),
    actif: z.boolean(),
});

type ClientForm = z.infer<typeof clientSchema>;

// ============================================================
// Composant
// ============================================================

export default function ClientsPage() {
    const { clients, loading, error, isInspection, reload } = useClients();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];

    const isUser = checkIsUser(roles);
    const isSeller = checkIsSeller(roles);

    const canEdit = (isUser || isSeller) && !isInspection;
    const canDelete = isUser && !isInspection;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientResponse | null>(null);
    const [search, setSearch] = useState('');
    const [villeFilter, setVilleFilter] = useState<string>('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ClientForm>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            adresse: '',
            ville: '',
            pays: 'Sénégal',
            siret: '',
            actif: true,
        },
    });

    // ============================================================
    // Villes uniques
    // ============================================================
    const villes = useMemo(() => {
        const set = new Set<string>();
        clients.forEach((c) => c.ville && set.add(c.ville));
        return Array.from(set).sort();
    }, [clients]);

    // ============================================================
    // Filtrage
    // ============================================================
    const filtered = useMemo(() => {
        return clients.filter((c) => {
            const matchSearch =
                !search ||
                c.nom.toLowerCase().includes(search.toLowerCase()) ||
                c.prenom.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase());

            const matchVille = !villeFilter || c.ville === villeFilter;

            return matchSearch && matchVille;
        });
    }, [clients, search, villeFilter]);

    // ============================================================
    // Totaux
    // ============================================================
    const totals = useMemo(() => {
        const total = filtered.length;
        const actifs = filtered.filter((c) => c.actif).length;
        return { total, actifs };
    }, [filtered]);

    // ============================================================
    // Actions
    // ============================================================

    const onSubmit = async (data: ClientForm): Promise<void> => {
        try {
            const payload = {
                ...data,
                telephone: data.telephone?.trim() || undefined,
                adresse: data.adresse?.trim() || undefined,
                ville: data.ville?.trim() || undefined,
                pays: data.pays?.trim() || undefined,
                siret: data.siret?.trim() || undefined,
            };

            if (editingClient) {
                await clientService.updateClient(editingClient.id, payload);
            } else {
                await clientService.createClient(payload);
            }
            closeModal();
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const openCreateModal = (): void => {
        setEditingClient(null);
        reset({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            adresse: '',
            ville: '',
            pays: 'Sénégal',
            siret: '',
            actif: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (c: ClientResponse): void => {
        setEditingClient(c);
        reset({
            nom: c.nom,
            prenom: c.prenom,
            email: c.email,
            telephone: c.telephone || '',
            adresse: c.adresse || '',
            ville: c.ville || '',
            pays: c.pays || 'Sénégal',
            siret: c.siret || '',
            actif: c.actif,
        });
        setIsModalOpen(true);
    };

    const closeModal = (): void => {
        setIsModalOpen(false);
        setEditingClient(null);
        reset();
    };

    const handleDelete = async (c: ClientResponse): Promise<void> => {
        const ok = confirm(`Supprimer le client "${c.prenom} ${c.nom}" ?`);
        if (!ok) return;
        try {
            await clientService.deleteClient(c.id);
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const handleToggleActif = async (c: ClientResponse): Promise<void> => {
        try {
            if (c.actif) {
                await clientService.deactivateClient(c.id);
            } else {
                // Réactiver : via update
                await clientService.updateClient(c.id, {
                    nom: c.nom,
                    prenom: c.prenom,
                    email: c.email,
                    telephone: c.telephone || undefined,
                    adresse: c.adresse || undefined,
                    ville: c.ville || undefined,
                    pays: c.pays || undefined,
                    siret: c.siret || undefined,
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
                title="Clients"
                subtitle={
                    isInspection
                        ? 'Clients de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Gérez vos clients'
                            : 'Liste des clients'
                }
                actions={
                    canEdit ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouveau client
                        </Button>
                    ) : undefined
                }
            />

            {/* Barre de filtres + indicateurs */}
            {!loading && clients.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom ou email…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={villeFilter}
                            onChange={(e) => setVilleFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Toutes les villes</option>
                            {villes.map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            <Squares2X2Icon className="h-4 w-4" />
                            {totals.total} client{totals.total > 1 ? 's' : ''}
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
                ) : clients.length === 0 ? (
                    <EmptyState
                        icon={<UserIcon className="h-16 w-16" />}
                        title="Aucun client"
                        description={
                            isInspection
                                ? 'Cette entreprise n\'a aucun client.'
                                : 'Commencez par créer votre premier client.'
                        }
                        action={
                            canEdit ? (
                                <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                    Créer un client
                                </Button>
                            ) : undefined
                        }
                    />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun client ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Client
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
                        {filtered.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary-700">
                          {c.prenom.charAt(0).toUpperCase()}
                            {c.nom.charAt(0).toUpperCase()}
                        </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {c.prenom} {c.nom}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {c.telephone || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {c.ville || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {c.actif ? (
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
                                                onClick={() => handleToggleActif(c)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    c.actif
                                                        ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                                                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                                }`}
                                                title={c.actif ? 'Désactiver' : 'Activer'}
                                            >
                                                {c.actif ? (
                                                    <XCircleIcon className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                )}
                                            </button>

                                            {/* Modifier */}
                                            <button
                                                onClick={() => openEditModal(c)}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Modifier"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>

                                            {/* Supprimer — USER uniquement */}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(c)}
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
                title={editingClient ? 'Modifier le client' : 'Nouveau client'}
                size="2xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button type="submit" form="client-form" loading={isSubmitting}>
                            {editingClient ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom *
                            </label>
                            <input
                                {...register('prenom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom *
                            </label>
                            <input
                                {...register('nom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
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
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
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

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="actif"
                            {...register('actif')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="actif" className="text-sm text-gray-700">
                            Client actif
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
}