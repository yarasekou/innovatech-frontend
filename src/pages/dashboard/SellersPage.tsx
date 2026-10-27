import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useSellers } from '../../hooks/useSellers';
import { sellerService } from '../../services/sellerService';
import type { UserResponse } from '../../types/user';

interface ApiError {
    response?: { data?: { message?: string } };
}

const sellerSchema = z.object({
    username: z.string().min(3, 'Min 3').max(50, 'Max 50'),
    email: z.string().email('Email invalide').max(150, 'Max 150'),
    password: z.string().min(6, 'Min 6').max(100, 'Max 100'),
    prenom: z.string().max(100).optional(),
    nom: z.string().max(100).optional(),
});

type SellerForm = z.infer<typeof sellerSchema>;

export default function SellersPage() {
    const { sellers, loading, error, reload } = useSellers();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SellerForm>({
        resolver: zodResolver(sellerSchema),
        defaultValues: { username: '', email: '', password: '', prenom: '', nom: '' },
    });

    const onSubmit = async (data: SellerForm) => {
        try {
            await sellerService.createSeller(data);
            closeModal();
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const openCreateModal = () => {
        reset({ username: '', email: '', password: '', prenom: '', nom: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleDelete = async (seller: UserResponse) => {
        const ok = confirm(`Supprimer définitivement le vendeur ${seller.prenom} ${seller.nom} ?`);
        if (!ok) return;
        try {
            await sellerService.deleteSeller(seller.id);
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const handleToggleActif = async (seller: UserResponse) => {
        try {
            await sellerService.toggleSellerActif(seller.id);
            await reload();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    return (
        <div className="p-8">
            <PageHeader
                title="Mes Vendeurs"
                subtitle="Gérez les vendeurs (SELLER) de votre boutique"
                actions={
                    <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                        Nouveau vendeur
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : sellers.length === 0 ? (
                    <EmptyState
                        icon={<UserGroupIcon className="h-16 w-16" />}
                        title="Aucun vendeur"
                        description="Créez votre premier vendeur pour qu'il puisse prendre des commandes en boutique."
                        action={
                            <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                Créer un vendeur
                            </Button>
                        }
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendeur</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {sellers.map((seller) => (
                            <tr key={seller.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary-700">
                                                {seller.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {seller.prenom} {seller.nom}
                                            </p>
                                            <p className="text-xs text-gray-500">@{seller.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                        {seller.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {seller.actif ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircleIcon className="h-4 w-4" /> Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <XCircleIcon className="h-4 w-4" /> Inactif
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleActif(seller)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                seller.actif
                                                    ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                            }`}
                                            title={seller.actif ? 'Désactiver' : 'Activer'}
                                        >
                                            {seller.actif ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(seller)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Supprimer"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
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
                title="Nouveau vendeur"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>Annuler</Button>
                        <Button type="submit" form="seller-form" loading={isSubmitting}>Créer</Button>
                    </>
                }
            >
                <form id="seller-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                        <input
                            {...register('username')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                            <input
                                {...register('prenom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                            <input
                                {...register('nom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                    </div>
                </form>
            </Modal>
        </div>
    );
}