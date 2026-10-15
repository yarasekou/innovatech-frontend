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

const loginSchema = z.object({
    email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ============================================================
// Composant
// ============================================================

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        try {
            const response = await authService.login(data);
            login(response);
            navigate('/dashboard');
        } catch (error: any) {
            setServerError(
                error.response?.data?.message || 'Erreur de connexion'
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="text-3xl font-bold text-primary-600">
                        InnovaTech
                    </Link>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Connexion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Accédez à votre espace
                    </p>
                </div>

                {/* Formulaire */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Erreur serveur */}
                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                id="email"
                                autoComplete="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                                placeholder="vous@exemple.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Mot de passe
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold rounded-lg transition-colors"
                        >
                            {isSubmitting ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    {/* Lien register */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Pas encore de compte ?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-primary-600 hover:underline"
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}