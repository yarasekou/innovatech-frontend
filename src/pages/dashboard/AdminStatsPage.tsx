import { useEffect, useState } from 'react';
import {
    UsersIcon,
    CubeIcon,
    BuildingOffice2Icon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';

export default function AdminStatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/admin/dashboard/global')
            .then(res => setStats(res.data))
            .catch(err => setError(err.response?.data?.message || 'Erreur'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!stats) return null;

    return (
        <div className="p-8">
            <PageHeader
                title="Statistiques Globales"
                subtitle="Vue d'ensemble de la plateforme InnovaTech"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Chiffre d'Affaires"
                    value={`${stats.chiffreAffairesTTC.toLocaleString('fr-FR')} FCFA`}
                    icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                    bg="bg-green-100"
                />
                <StatCard
                    label="Entreprises"
                    value={stats.panierMoyen} // On utilise ce champ pour le nb d'entreprises
                    icon={<BuildingOffice2Icon className="h-6 w-6 text-blue-600" />}
                    bg="bg-blue-100"
                />
                <StatCard
                    label="Produits"
                    value={stats.nbProduits}
                    icon={<CubeIcon className="h-6 w-6 text-purple-600" />}
                    bg="bg-purple-100"
                />
                <StatCard
                    label="Clients"
                    value={stats.nbClients}
                    icon={<UsersIcon className="h-6 w-6 text-orange-600" />}
                    bg="bg-orange-100"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Commandes Totales"
                    value={stats.nbCommandes}
                    icon={<ShoppingCartIcon className="h-6 w-6 text-indigo-600" />}
                    bg="bg-indigo-100"
                />
                <StatCard
                    label="Paiements"
                    value={stats.nbPaiements}
                    icon={<DocumentTextIcon className="h-6 w-6 text-teal-600" />}
                    bg="bg-teal-100"
                />
                <StatCard
                    label="Achats Fournisseurs"
                    value={stats.nbCommandesAchat}
                    icon={<ShoppingCartIcon className="h-6 w-6 text-pink-600" />}
                    bg="bg-pink-100"
                />
            </div>

            <div className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6">
                <p className="text-sm text-primary-700">
                    👁️ Cliquez sur <strong>Utilisateurs</strong> dans le menu pour inspecter les boutiques d'un ADMIN.
                </p>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, bg }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}