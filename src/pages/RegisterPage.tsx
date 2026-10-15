import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

// ============================================================
// Validation
// ============================================================

const registerSchema = z.object({
    // Compte
    username: z.string().min(3, 'Min 3 caractères').max(50, 'Max 50 caractères'),
    email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
    password: z.string().min(6, 'Min 6 caractères').max(100, 'Max 100 caractères'),
    prenom: z.string().max(100, 'Max 100 caractères').optional(),
    nom: z.string().max(100, 'Max 100 caractères').optional(),

    // Entreprise
    entrepriseNom: z.string().min(2, 'Min 2 caractères').max(150, 'Max 150 caractères'),
    entrepriseEmail: z.string().email('Email invalide').optional().or(z.literal('')),
    entrepriseTelephone: z.string().max(20, 'Max 20 caractères').optional(),
    entrepriseVille: z.string().max(100, 'Max 100 caractères').optional(),
    entreprisePays: z.string().max(100, 'Max 100 caractères').optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

// ============================================================
// Composant
// ============================================================

export default function RegisterPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            entreprisePays: 'Sénégal',
        },
    });

    const onSubmit = async (data: RegisterForm) => {
        setServerError(null);
        try {
            const response = await authService.registerAdmin({
                username: data.username,
                email: data.email,
                password: data.password,
                prenom: data.prenom,
                nom: data.nom,
                entreprise: {
                    nom: data.entrepriseNom,
                    email: data.entrepriseEmail || undefined,
                    telephone: data.entrepriseTelephone,
                    ville: data.entrepriseVille,
                    pays: data.entreprisePays,
                    devise: 'XOF',
                    tvaPercent: 18,
                },
            });
            login(response);
            navigate('/dashboard');
        } catch (error: any) {
            setServerError(
                error.response?.data?.message || 'Erreur lors de l\'inscription'
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="text-3xl font-bold text-primary-600">
                        InnovaTech
                    </Link>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Créer un compte
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Créez votre entreprise et commencez à gérer
                    </p>
                </div>

                {/* Formulaire */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* ------------------------------------------------- */}
                        {/* Section 1 : Compte */}
                        {/* ------------------------------------------------- */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                👤 Votre compte
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom d'utilisateur *
                                    </label>
                                    <input
                                        {...register('username')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="ali"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="ali@exemple.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        {...register('prenom')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Ali"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom
                                    </label>
                                    <input
                                        {...register('nom')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Ndiaye"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mot de passe *
                                    </label>
                                    <input
                                        {...register('password')}
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ------------------------------------------------- */}
                        {/* Section 2 : Entreprise */}
                        {/* ------------------------------------------------- */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                🏢 Votre entreprise
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de l'entreprise *
                                    </label>
                                    <input
                                        {...register('entrepriseNom')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Ali Électronique"
                                    />
                                    {errors.entrepriseNom && (
                                        <p className="mt-1 text-sm text-red-600">{errors.entrepriseNom.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email entreprise
                                    </label>
                                    <input
                                        {...register('entrepriseEmail')}
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="contact@exemple.sn"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        {...register('entrepriseTelephone')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="+221 77 111 11 11"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ville
                                    </label>
                                    <input
                                        {...register('entrepriseVille')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Dakar"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pays
                                    </label>
                                    <input
                                        {...register('entreprisePays')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Sénégal"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold rounded-lg transition-colors"
                        >
                            {isSubmitting ? 'Création...' : 'Créer mon compte'}
                        </button>
                    </form>

                    {/* Lien login */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Déjà un compte ?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:underline"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}