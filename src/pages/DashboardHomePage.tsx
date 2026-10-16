import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingCartIcon,
    CubeIcon,
    UsersIcon,
    CurrencyDollarIcon,
    TruckIcon,
    DocumentTextIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';
import { isSuperAdmin } from '../types/auth';
import type { DashboardStats } from '../types/dashboard';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function DashboardHomePage() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isSuper = isSuperAdmin(roles);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    // ============================================================
    // Vue SUPER_ADMIN (global)
    // ============================================================
    if (isSuper && !userId) {
        return (
            <div className="p-8">
                <PageHeader
                    title="Tableau de bord"
                    subtitle="Vue globale de la plateforme"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Clients"
                        value={stats.nbClients.toLocaleString('fr-FR')}
                        icon={<UsersIcon className="h-6 w-6 text-purple-600" />}
                        bg="bg-purple-100"
                    />
                    <StatCard
                        label="Produits"
                        value={stats.nbProduits.toLocaleString('fr-FR')}
                        icon={<CubeIcon className="h-6 w-6 text-green-600" />}
                        bg="bg-green-100"
                    />
                    <StatCard
                        label="Paiements"
                        value={stats.nbPaiements.toLocaleString('fr-FR')}
                        icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />}
                        bg="bg-blue-100"
                    />
                    <StatCard
                        label="Achats"
                        value={stats.nbCommandesAchat.toLocaleString('fr-FR')}
                        icon={<TruckIcon className="h-6 w-6 text-orange-600" />}
                        bg="bg-orange-100"
                    />
                </div>
                <div className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6">
                    <p className="text-sm text-primary-700">
                        👁️ Cliquez sur <strong>Utilisateurs</strong> pour inspecter
                        les boutiques d'un ADMIN.
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // Vue tenant (ADMIN / USER / SELLER)
    // ============================================================
    return (
        <div className="p-8">
            <PageHeader
                title="Tableau de bord"
                subtitle="Aperçu de votre activité"
            />

            {/* Ligne 1 : CA + marge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard
                    label="CA HT"
                    value={`${stats.chiffreAffairesHT.toLocaleString('fr-FR')} FCFA`}
                    icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                    bg="bg-green-100"
                />
                <StatCard
                    label="CA TTC"
                    value={`${stats.chiffreAffairesTTC.toLocaleString('fr-FR')} FCFA`}
                    icon={<CurrencyDollarIcon className="h-6 w-6 text-blue-600" />}
                    bg="bg-blue-100"
                />
                <StatCard
                    label="Marge totale"
                    value={`${stats.margeTotale.toLocaleString('fr-FR')} FCFA`}
                    icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
                    bg="bg-purple-100"
                />
            </div>

            {/* Ligne 2 : compteurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    label="Commandes"
                    value={stats.nbCommandes.toLocaleString('fr-FR')}
                    icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />}
                    bg="bg-blue-100"
                    onClick={() => navigate('/dashboard/commandes')}
                />
                <StatCard
                    label="Produits"
                    value={stats.nbProduits.toLocaleString('fr-FR')}
                    icon={<CubeIcon className="h-6 w-6 text-green-600" />}
                    bg="bg-green-100"
                    onClick={() => navigate('/dashboard/produits')}
                />
                <StatCard
                    label="Clients"
                    value={stats.nbClients.toLocaleString('fr-FR')}
                    icon={<UsersIcon className="h-6 w-6 text-purple-600" />}
                    bg="bg-purple-100"
                    onClick={() => navigate('/dashboard/clients')}
                />
                <StatCard
                    label="Panier moyen"
                    value={`${stats.panierMoyen.toLocaleString('fr-FR')} FCFA`}
                    icon={<CurrencyDollarIcon className="h-6 w-6 text-orange-600" />}
                    bg="bg-orange-100"
                />
            </div>

            {/* Statuts commandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Commandes par statut
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatusCard
                        label="En attente"
                        count={stats.nbCommandesEnAttente}
                        color="bg-yellow-50 text-yellow-700 border-yellow-200"
                    />
                    <StatusCard
                        label="Validées"
                        count={stats.nbCommandesValidees}
                        color="bg-blue-50 text-blue-700 border-blue-200"
                    />
                    <StatusCard
                        label="En cours"
                        count={stats.nbCommandesEnCours}
                        color="bg-indigo-50 text-indigo-700 border-indigo-200"
                    />
                    <StatusCard
                        label="Livrées"
                        count={stats.nbCommandesLivrees}
                        color="bg-green-50 text-green-700 border-green-200"
                    />
                    <StatusCard
                        label="Annulées"
                        count={stats.nbCommandesAnnulees}
                        color="bg-red-50 text-red-700 border-red-200"
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Composants
// ============================================================

interface StatCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    bg: string;
    onClick?: () => void;
}

function StatCard({ label, value, icon, bg, onClick }: StatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${
                onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
        >
            <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

interface StatusCardProps {
    label: string;
    count: number;
    color: string;
}

function StatusCard({ label, count, color }: StatusCardProps) {
    return (
        <div className={`rounded-xl border p-4 ${color}`}>
            <p className="text-xs uppercase font-semibold opacity-75">{label}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
    );
}