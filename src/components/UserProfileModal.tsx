import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    UserCircleIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================
// Validation
// ============================================================

const profileSchema = z.object({
    username: z.string().min(3, 'Min 3').max(50, 'Max 50'),
    email: z.string().email('Email invalide'),
    prenom: z.string().max(100, 'Max 100').optional().or(z.literal('')),
    nom: z.string().max(100, 'Max 100').optional().or(z.literal('')),
});

const passwordSchema = z.object({
    ancienMotDePasse: z.string().min(1, 'Requis'),
    nouveauMotDePasse: z.string().min(6, 'Min 6').max(100, 'Max 100'),
    confirmation: z.string().min(6, 'Min 6'),
}).refine((data) => data.nouveauMotDePasse === data.confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmation'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ============================================================
// Composant
// ============================================================

export default function UserProfileModal({
                                             isOpen,
                                             onClose,
                                         }: UserProfileModalProps) {
    const { user, updateUser } = useAuthStore();
    const [tab, setTab] = useState<'profile' | 'password'>('profile');
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        reset: resetProfile,
        formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPassword,
        formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    // Init
    useEffect(() => {
        if (isOpen && user) {
            resetProfile({
                username: user.username,
                email: user.email,
                // ⚠️ On ne connaît pas prenom/nom côté store.
                // On laisse vide → non envoyés au back → non écrasés.
                prenom: '',
                nom: '',
            });
            resetPassword({
                ancienMotDePasse: '',
                nouveauMotDePasse: '',
                confirmation: '',
            });
            setSuccess(null);
            setTab('profile');
        }
    }, [isOpen, user, resetProfile, resetPassword]);

    // Submit profil
    const onProfileSubmit = async (data: ProfileForm): Promise<void> => {
        try {
            const response = await authService.updateProfile({
                username: data.username,
                email: data.email,
                // ⚠️ N'envoyer que si non-vide → préserve l'existant côté back
                prenom: data.prenom?.trim() || undefined,
                nom: data.nom?.trim() || undefined,
            });

            updateUser(
                {
                    email: response.email,
                    username: response.username,
                    roles: response.roles,
                },
                response.token
            );

            setSuccess('Profil mis à jour');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // Submit mot de passe
    const onPasswordSubmit = async (data: PasswordForm): Promise<void> => {
        try {
            await authService.changePassword({
                ancienMotDePasse: data.ancienMotDePasse,
                nouveauMotDePasse: data.nouveauMotDePasse,
            });

            resetPassword({
                ancienMotDePasse: '',
                nouveauMotDePasse: '',
                confirmation: '',
            });
            setSuccess('Mot de passe changé');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mon profil"
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Fermer
                    </Button>
                    {tab === 'profile' ? (
                        <Button
                            type="submit"
                            form="profile-form"
                            loading={isSubmittingProfile}
                        >
                            Enregistrer
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            form="password-form"
                            loading={isSubmittingPassword}
                        >
                            Changer le mot de passe
                        </Button>
                    )}
                </>
            }
        >
            {/* Onglets */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'profile'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <UserCircleIcon className="h-4 w-4" />
                    Informations
                </button>
                <button
                    onClick={() => setTab('password')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'password'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <LockClosedIcon className="h-4 w-4" />
                    Mot de passe
                </button>
            </div>

            {/* Succès */}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">✅ {success}</p>
                </div>
            )}

            {/* Profil */}
            {tab === 'profile' && (
                <form id="profile-form" onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur *
                        </label>
                        <input
                            {...registerProfile('username')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {profileErrors.username && (
                            <p className="mt-1 text-sm text-red-600">{profileErrors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            {...registerProfile('email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {profileErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                {...registerProfile('prenom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Laisser vide pour ne pas changer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                {...registerProfile('nom')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Laisser vide pour ne pas changer"
                            />
                        </div>
                    </div>
                </form>
            )}

            {/* Mot de passe */}
            {tab === 'password' && (
                <form id="password-form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ancien mot de passe *
                        </label>
                        <input
                            {...registerPassword('ancienMotDePasse')}
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {passwordErrors.ancienMotDePasse && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.ancienMotDePasse.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nouveau mot de passe *
                        </label>
                        <input
                            {...registerPassword('nouveauMotDePasse')}
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {passwordErrors.nouveauMotDePasse && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.nouveauMotDePasse.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmer le mot de passe *
                        </label>
                        <input
                            {...registerPassword('confirmation')}
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {passwordErrors.confirmation && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmation.message}</p>
                        )}
                    </div>
                </form>
            )}
        </Modal>
    );
}