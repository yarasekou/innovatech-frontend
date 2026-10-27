import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useParams } from 'react-router-dom';
import {
    HomeIcon,
    ShoppingCartIcon,
    UsersIcon,
    CubeIcon,
    TagIcon,
    TruckIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ArrowUturnLeftIcon,
    ShoppingBagIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftIcon,
    BuildingOffice2Icon,
    UserPlusIcon, // ⚠️ NOUVEAU pour Mes Vendeurs
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { isAdmin, isSuperAdmin, isUser } from '../types/auth';
import { adminInspectionService } from '../services/adminInspectionService';
import { entrepriseService } from '../services/entrepriseService';
import UserProfileModal from '../components/UserProfileModal';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { userId } = useParams<{ userId?: string }>();

    const roles = user?.roles || [];
    const isSuper = isSuperAdmin(roles);
    const isAdminUser = isAdmin(roles);
    const isUserRole = isUser(roles); // ⚠️ NOUVEAU : Vérifie si c'est un USER (manager)
    const isTenant = !isSuper;

    const isInspecting = isSuper && !!userId;

    const [entrepriseName, setEntrepriseName] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        if (isInspecting && userId) {
            adminInspectionService
                .getProfil(Number(userId))
                .then((data) => setEntrepriseName(data.entrepriseNom))
                .catch(() => setEntrepriseName(null));
        } else if (isTenant) {
            entrepriseService
                .getMyEntreprise()
                .then((data) => setEntrepriseName(data.nom))
                .catch(() => setEntrepriseName(null));
        } else {
            setEntrepriseName(null);
        }
    }, [isInspecting, userId, isTenant]);

    const prefix = isInspecting ? `/dashboard/users/${userId}` : '/dashboard';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ============================================================
    // Navigation
    // ============================================================
    const navigation = isInspecting
        ? [
            // --- INSPECTION (SUPER_ADMIN) ---
            { name: 'Tableau de bord', href: `${prefix}`, icon: HomeIcon, end: true },
            { name: 'Entreprise', href: `${prefix}/entreprise`, icon: BuildingOffice2Icon, end: false },
            { name: 'Catégories', href: `${prefix}/categories`, icon: TagIcon, end: false },
            { name: 'Produits', href: `${prefix}/produits`, icon: CubeIcon, end: false },
            { name: 'Clients', href: `${prefix}/clients`, icon: UsersIcon, end: false },
            { name: 'Fournisseurs', href: `${prefix}/fournisseurs`, icon: TruckIcon, end: false },
            { name: 'Commandes', href: `${prefix}/commandes`, icon: ShoppingCartIcon, end: false },
        ]
        : isSuper
            ? [
                // --- SUPER_ADMIN (Vue globale) ---
                { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon, end: true },
                { name: 'Utilisateurs', href: '/dashboard/users', icon: UserGroupIcon, end: false },
                { name: 'Statistiques', href: '/dashboard/stats', icon: ChartBarIcon, end: false },
            ]
            : [
                // --- TENANT (ADMIN / USER / SELLER) ---
                { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon, end: true },
                { name: 'Entreprise', href: '/dashboard/entreprise', icon: BuildingOffice2Icon, end: false },
                { name: 'Catégories', href: '/dashboard/categories', icon: TagIcon, end: false },
                { name: 'Produits', href: '/dashboard/produits', icon: CubeIcon, end: false },
                { name: 'Clients', href: '/dashboard/clients', icon: UsersIcon, end: false },
                { name: 'Fournisseurs', href: '/dashboard/fournisseurs', icon: TruckIcon, end: false },
                { name: 'Commandes', href: '/dashboard/commandes', icon: ShoppingCartIcon, end: false },
                { name: 'Paiements', href: '/dashboard/paiements', icon: DocumentTextIcon, end: false },
                { name: 'Retours', href: '/dashboard/retours', icon: ArrowUturnLeftIcon, end: false },
                { name: 'Achats', href: '/dashboard/achats', icon: ShoppingBagIcon, end: false },
                { name: 'Factures', href: '/dashboard/factures', icon: DocumentTextIcon, end: false },

                // ⚠️ NOUVEAU : Le lien "Mes Vendeurs" apparaît uniquement pour un USER
                ...(isUserRole && !isAdminUser
                    ? [{ name: 'Mes Vendeurs', href: '/dashboard/sellers', icon: UserPlusIcon, end: false }]
                    : []),

                // ⚠️ Le lien "Utilisateurs" apparaît uniquement pour un ADMIN
                ...(isAdminUser
                    ? [{ name: 'Utilisateurs', href: '/dashboard/users', icon: UserGroupIcon, end: false }]
                    : []),
            ];

    return (
        <div className="min-h-screen flex bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col print:hidden">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link to="/dashboard" className="text-xl font-bold text-primary-600">
                        InnovaTech
                    </Link>
                </div>

                {/* Bloc Entreprise */}
                {isInspecting ? (
                    <>
                        <Link
                            to="/dashboard/users"
                            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Retour aux ADMINs
                        </Link>

                        {entrepriseName && (
                            <div className="mx-3 mt-2 px-3 py-2 bg-primary-50 rounded-md">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Entreprise</p>
                                <p className="text-sm font-semibold text-primary-700 truncate">{entrepriseName}</p>
                            </div>
                        )}
                    </>
                ) : isTenant && entrepriseName ? (
                    <div className="mx-3 mt-3 px-3 py-2 bg-primary-50 rounded-md">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Entreprise</p>
                        <p className="text-sm font-semibold text-primary-700 truncate">{entrepriseName}</p>
                    </div>
                ) : null}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <NavLink
                                    to={item.href}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-600'
                                                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                                        }`
                                    }
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User info + Logout */}
                <div className="p-4 border-t border-gray-200">
                    {user && (
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="w-full mb-3 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                            title="Modifier mon profil"
                        >
                            <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-primary-600 font-medium mt-1 truncate">
                                {roles.includes('ROLE_SUPER_ADMIN') && '🟣 Super Admin'}
                                {roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_SUPER_ADMIN') && '🔵 Admin'}
                                {roles.includes('ROLE_USER') && !roles.includes('ROLE_ADMIN') && '🟢 User'}
                                {roles.includes('ROLE_SELLER') && '🟠 Seller'}
                            </p>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        Se déconnecter
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto print:ml-0 print:w-full">
                <Outlet />
            </main>

            {/* Modal de profil */}
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}