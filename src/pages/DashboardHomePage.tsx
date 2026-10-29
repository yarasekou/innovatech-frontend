import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ShoppingCartIcon, CubeIcon, UsersIcon, CurrencyDollarIcon,
    ChartBarIcon, ArrowTrendingUpIcon, DocumentTextIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';
import { isSuperAdmin } from '../types/auth';
import type { DashboardStats, ChiffreAffairesMois, TopProduit, TopClient } from '../types/dashboard';

type Periode = 'AUJOURDHUI' | '7J' | 'MOIS' | 'ANNEE' | 'TOUT';

export default function DashboardHomePage() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const isSuper = isSuperAdmin(roles);

    const [periode, setPeriode] = useState<Periode>('TOUT');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [caMensuel, setCaMensuel] = useState<ChiffreAffairesMois[]>([]);
    const [topProduits, setTopProduits] = useState<TopProduit[]>([]);
    const [topClients, setTopClients] = useState<TopClient[]>([]);
    const [loading, setLoading] = useState(true);

    const getDates = (p: Periode) => {
        const today = new Date();
        const format = (d: Date) => d.toISOString().split('T')[0];

        switch (p) {
            case 'AUJOURDHUI':
                return { dateDebut: format(today), dateFin: format(today) };
            case '7J': {
                const ilYa7Jours = new Date();
                ilYa7Jours.setDate(today.getDate() - 7);
                return { dateDebut: format(ilYa7Jours), dateFin: format(today) };
            }
            case 'MOIS': {
                const debutMois = new Date(today.getFullYear(), today.getMonth(), 1);
                return { dateDebut: format(debutMois), dateFin: format(today) };
            }
            case 'ANNEE': {
                const debutAnnee = new Date(today.getFullYear(), 0, 1);
                return { dateDebut: format(debutAnnee), dateFin: format(today) };
            }
            case 'TOUT':
            default:
                return { dateDebut: undefined, dateFin: undefined };
        }
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);

            // ⚠️ Si c'est un SUPER_ADMIN (et qu'on n'est pas en mode inspection), on ne charge que les stats globales
            if (isSuper && !userId) {
                const statsData = await dashboardService.getStats();
                setStats(statsData);
                setLoading(false);
                return;
            }

            const { dateDebut, dateFin } = getDates(periode);
            const [statsData, caData, topP, topC] = await Promise.all([
                dashboardService.getStats(dateDebut, dateFin),
                dashboardService.getChiffreAffairesMensuel(dateDebut, dateFin),
                dashboardService.getTopProduits(5, dateDebut, dateFin),
                dashboardService.getTopClients(5, dateDebut, dateFin),
            ]);
            setStats(statsData);
            setCaMensuel(caData.sort((a, b) => {
                if (a.annee !== b.annee) return a.annee - b.annee;
                return a.mois - b.mois;
            }));
            setTopProduits(topP);
            setTopClients(topC);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [periode, isSuper, userId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading && !stats) return <LoadingSpinner />;
    if (!stats) return null;

    // ============================================================
    // VUE SUPER_ADMIN
    // ============================================================
    if (isSuper && !userId) {
        return (
            <div className="p-8">
                <PageHeader title="Tableau de bord" subtitle="Vue globale de la plateforme" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Clients" value={stats.nbClients} icon={<UsersIcon className="h-6 w-6 text-purple-600" />} bg="bg-purple-100" />
                    <StatCard label="Produits" value={stats.nbProduits} icon={<CubeIcon className="h-6 w-6 text-green-600" />} bg="bg-green-100" />
                    <StatCard label="Paiements" value={stats.nbPaiements} icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />} bg="bg-blue-100" />
                    <StatCard label="Achats" value={stats.nbCommandesAchat} icon={<ShoppingCartIcon className="h-6 w-6 text-orange-600" />} bg="bg-orange-100" />
                </div>
                <div className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6">
                    <p className="text-sm text-primary-700">
                        👁️ Cliquez sur <strong>Utilisateurs</strong> dans le menu pour inspecter les boutiques d'un ADMIN.
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // VUE TENANT (ADMIN / USER / SELLER)
    // ============================================================
    return (
        <div className="p-8">
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <PageHeader title="Tableau de bord" subtitle="Aperçu de votre activité" />

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    <select
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value as Periode)}
                        className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                    >
                        <option value="TOUT">Tout le temps</option>
                        <option value="AUJOURDHUI">Aujourd'hui</option>
                        <option value="7J">7 derniers jours</option>
                        <option value="MOIS">Ce mois-ci</option>
                        <option value="ANNEE">Cette année</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard label="Chiffre d'Affaires" value={`${stats.chiffreAffairesTTC.toLocaleString('fr-FR')} FCFA`} icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />} bg="bg-green-100" />
                <StatCard label="Marge Totale" value={`${stats.margeTotale.toLocaleString('fr-FR')} FCFA`} icon={<ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />} bg="bg-blue-100" />
                <StatCard label="Panier Moyen" value={`${stats.panierMoyen.toLocaleString('fr-FR')} FCFA`} icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />} bg="bg-purple-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Commandes" value={stats.nbCommandes} icon={<ShoppingCartIcon className="h-6 w-6 text-orange-600" />} bg="bg-orange-100" onClick={() => navigate('/dashboard/commandes')} />
                <StatCard label="Produits" value={stats.nbProduits} icon={<CubeIcon className="h-6 w-6 text-green-600" />} bg="bg-green-100" onClick={() => navigate('/dashboard/produits')} />
                <StatCard label="Clients" value={stats.nbClients} icon={<UsersIcon className="h-6 w-6 text-purple-600" />} bg="bg-purple-100" onClick={() => navigate('/dashboard/clients')} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Évolution du Chiffre d'Affaires</h2>
                <div className="h-72 w-full">
                    {caMensuel.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={caMensuel} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="libelle" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(value) => `${value / 1000}k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`} />
                                <Area type="monotone" dataKey="chiffreAffaires" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCa)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Aucune vente sur cette période
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Produits</h2>
                    <div className="space-y-4">
                        {topProduits.map((p, index) => (
                            <div key={p.produitId} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{p.nom}</p>
                                    <p className="text-xs text-gray-500">{p.quantiteVendue} vendus</p>
                                </div>
                                <p className="text-sm font-semibold text-green-600">{p.chiffreAffaires.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Clients</h2>
                    <div className="space-y-4">
                        {topClients.map((c, index) => (
                            <div key={c.clientId} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{c.prenom} {c.nom}</p>
                                    <p className="text-xs text-gray-500">{c.nbCommandes} commandes</p>
                                </div>
                                <p className="text-sm font-semibold text-green-600">{c.chiffreAffaires.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                        ))}
                    </div>
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
    value: string | number;
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