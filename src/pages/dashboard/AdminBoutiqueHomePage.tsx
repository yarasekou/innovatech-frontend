import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    CubeIcon,
    UsersIcon,
    ShoppingCartIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminInspectionService } from '../../services/adminInspectionService';
import type { UserResponse } from '../../types/user';

export default function AdminBoutiqueHomePage() {
    const { userId } = useParams<{ userId: string }>();
    const targetUserId = Number(userId);

    const [admin, setAdmin] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await adminInspectionService.getProfil(targetUserId);
                setAdmin(data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        if (targetUserId) load();
    }, [targetUserId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!admin) return null;

    return (
        <div className="p-8">
            {/* Header avec le nom de l'entreprise */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {admin.entrepriseNom}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Boutique de <strong>{admin.prenom} {admin.nom}</strong> (@{admin.username})
                </p>
            </div>

            {/* Cartes de raccourcis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                    to={`/dashboard/users/${targetUserId}/produits`}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <CubeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500">Produits</p>
                    <p className="text-lg font-semibold text-gray-900">Voir le catalogue</p>
                </Link>

                <Link
                    to={`/dashboard/users/${targetUserId}/categories`}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <TagIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500">Catégories</p>
                    <p className="text-lg font-semibold text-gray-900">Organiser</p>
                </Link>

                <Link
                    to={`/dashboard/users/${targetUserId}/clients`}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <UsersIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">Clients</p>
                    <p className="text-lg font-semibold text-gray-900">Voir les clients</p>
                </Link>

                <Link
                    to={`/dashboard/users/${targetUserId}/commandes`}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                        <ShoppingCartIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-500">Commandes</p>
                    <p className="text-lg font-semibold text-gray-900">Voir les commandes</p>
                </Link>
            </div>

            {/* Message d'info */}
            <div className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6">
                <p className="text-sm text-primary-700">
                    👁️ Vous êtes en <strong>mode supervision</strong>. Vous pouvez consulter
                    les données de cette entreprise mais pas les modifier.
                </p>
            </div>
        </div>
    );
}