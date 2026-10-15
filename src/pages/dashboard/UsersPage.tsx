import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin, isSuperAdmin } from '../../types/auth';
import type { UserResponse } from '../../types/user';

// ============================================================
// Types utilitaires
// ============================================================

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

// ============================================================
// Validation
// ============================================================

const createSchema = z.object({
    username: z.string().min(3, 'Min 3 caractères').max(50, 'Max 50 caractères'),
    email: z.string().min(1, 'Requis').email('Email invalide'),
    password: z.string().min(6, 'Min 6 caractères'),
    prenom: z.string().max(100, 'Max 100 caractères').optional(),
    nom: z.string().max(100, 'Max 100 caractères').optional(),
});

type CreateForm = z.infer<typeof createSchema>;

// ============================================================
// Badge de rôle
// ============================================================

function RoleBadge({ roles }: { roles: string[] }) {
    if (roles.includes('ROLE_SUPER_ADMIN')) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <ShieldCheckIcon className="h-3 w-3" />
                Super Admin
            </span>
        );
    }
    if (roles.includes('ROLE_ADMIN')) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <BuildingOfficeIcon className="h-3 w-3" />
                Admin
            </span>
        );
    }
    if (roles.includes('ROLE_USER')) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <UserCircleIcon className="h-3 w-3" />
                User
            </span>
        );
    }
    if (roles.includes('ROLE_SELLER')) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                <UserCircleIcon className="h-3 w-3" />
                Seller
            </span>
        );
    }
    return null;
}

// ============================================================
// Types
// ============================================================

interface Group {
    admin: UserResponse | null;
    users: UserResponse[];
}

// ============================================================
// Composant
// ============================================================

export default function UsersPage() {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canCreate = isAdmin(roles);
    const isSuper = isSuperAdmin(roles);

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateForm>({
        resolver: zodResolver(createSchema),
    });

    // ⚠️ loadUsers DÉCLARÉ AVANT useEffect
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getMyUsers();
            setUsers(data);
        } catch (err: unknown) {
            const error = err as ApiError;
            setError(error.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // ============================================================
    // Regroupement
    // ============================================================
    const groups: Group[] = useMemo(() => {
        const admins = users.filter((u) => u.roles.includes('ROLE_ADMIN'));
        const userList = users.filter((u) => u.roles.includes('ROLE_USER'));

        const result: Group[] = [];

        admins.forEach((admin) => {
            const adminUsers = userList.filter(
                (u) => u.entrepriseId === admin.entrepriseId
            );
            result.push({ admin, users: adminUsers });
        });

        const orphanUsers = userList.filter((u) => !u.entrepriseId);
        if (orphanUsers.length > 0) {
            result.push({ admin: null, users: orphanUsers });
        }

        if (admins.length === 0 && userList.length > 0) {
            result.push({ admin: null, users: userList });
        }

        return result;
    }, [users]);

    const isMe = (user: UserResponse) => user.email === authUser?.email;

    // ============================================================
    // Actions
    // ============================================================

    const onSubmit = async (data: CreateForm) => {
        try {
            await userService.createUser(data);
            closeModal();
            await loadUsers();
        } catch (err: unknown) {
            const error = err as ApiError;
            alert(error.response?.data?.message || 'Erreur');
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

    const handleDelete = async (user: UserResponse) => {
        const ok = confirm(
            `Supprimer ${user.prenom} ${user.nom} ?\n\n` +
            `Cette action marque l'utilisateur comme supprimé. ` +
            `Ses données (commandes, clients…) sont conservées pour l'historique.`
        );
        if (!ok) return;

        try {
            await userService.deleteUser(user.id);
            await loadUsers();
        } catch (err: unknown) {
            const error = err as ApiError;
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Ligne de tableau
    // ============================================================

    const renderRow = (
        user: UserResponse,
        indent: boolean,
        rowSpan: number = 1,
        showEntreprise: boolean = true,
        groupNumber: number | null = null
    ) => {
        const mine = isMe(user);
        return (
            <tr
                key={user.id}
                className={`hover:bg-gray-50 ${mine ? 'bg-primary-50/30' : ''}`}
            >
                {groupNumber !== null && (
                    <td rowSpan={rowSpan} className="px-3 py-4 text-center align-middle">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold">
                            {groupNumber}
                        </span>
                    </td>
                )}

                <td className="px-6 py-4">
                    <div className={`flex items-center gap-3 ${indent ? 'pl-8' : ''}`}>
                        {indent && (
                            <span className="text-gray-300 font-mono text-lg select-none">
                                └─
                            </span>
                        )}
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                                {user.username.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {user.prenom} {user.nom}
                                {mine && (
                                    <span className="ml-2 text-xs font-normal text-primary-600">
                                        (vous)
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4">
                    <RoleBadge roles={user.roles} />
                </td>

                {showEntreprise && (
                    <td
                        rowSpan={rowSpan}
                        className="px-6 py-4 text-sm font-medium border-l border-gray-100 align-middle"
                    >
                        {user.entrepriseNom ? (
                            isSuper && user.roles.includes('ROLE_ADMIN') ? (
                                <button
                                    onClick={() => navigate(`/dashboard/users/${user.id}`)}
                                    className="text-primary-600 hover:text-primary-700 hover:underline transition-colors text-left"
                                    title="Voir la boutique"
                                >
                                    {user.entrepriseNom}
                                </button>
                            ) : (
                                <span className="text-gray-700">{user.entrepriseNom}</span>
                            )
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </td>
                )}

                <td className="px-6 py-4">
                    {user.actif ? (
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
                <td className="px-6 py-4 text-right">
                    {mine ? (
                        <span className="text-xs text-gray-400 italic">
                            Actions désactivées
                        </span>
                    ) : (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => handleDelete(user)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </td>
            </tr>
        );
    };

    // ============================================================
    // Rendu
    // ============================================================
    return (
        <div className="p-8">
            <PageHeader
                title="Utilisateurs"
                subtitle={
                    isSuper
                        ? 'Tous les utilisateurs de la plateforme, groupés par entreprise'
                        : 'Vous et les utilisateurs de votre entreprise'
                }
                actions={
                    canCreate ? (
                        <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                            Nouvel utilisateur
                        </Button>
                    ) : undefined
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : users.length === 0 ? (
                    <EmptyState
                        title="Aucun utilisateur"
                        description={
                            canCreate
                                ? 'Commencez par créer votre premier utilisateur.'
                                : 'Aucun utilisateur trouvé.'
                        }
                        action={
                            canCreate ? (
                                <Button icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal}>
                                    Créer un utilisateur
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                                #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-100">
                                Entreprise
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {groups.map((group, gi) => {
                            const rowSpan = (group.admin ? 1 : 0) + group.users.length;

                            return (
                                <Fragment key={gi}>
                                    {group.admin ? (
                                        renderRow(group.admin, false, rowSpan, true, gi + 1)
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-3 bg-gray-50">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">
                                                        Utilisateurs sans entreprise
                                                    </span>
                                            </td>
                                        </tr>
                                    )}

                                    {group.users.map((user) =>
                                        renderRow(user, true, 1, false, null)
                                    )}

                                    {gi < groups.length - 1 && (
                                        <tr>
                                            <td colSpan={7} className="p-0">
                                                <div className="h-1 bg-gray-200"></div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de création */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Nouvel utilisateur"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button type="submit" form="user-form" loading={isSubmitting}>
                            Créer
                        </Button>
                    </>
                }
            >
                <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur *
                        </label>
                        <input
                            {...register('username')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                        )}
                    </div>

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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                {...register('prenom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                {...register('nom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe *
                        </label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
}