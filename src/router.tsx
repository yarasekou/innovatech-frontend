import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHomePage from './pages/DashboardHomePage';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './components/PlaceholderPage';
import AdminBoutiqueHomePage from './pages/dashboard/AdminBoutiqueHomePage';
import UsersPage from './pages/dashboard/UsersPage';
import ProduitsPage from './pages/dashboard/ProduitsPage';
import ProduitDetailPage from './pages/dashboard/ProduitDetailPage';
import CategoriesPage from './pages/dashboard/CategoriesPage';
import MonEntreprisePage from './pages/dashboard/MonEntreprisePage';
import ClientsPage from './pages/dashboard/ClientsPage';
import FournisseursPage from './pages/dashboard/FournisseursPage';
import CommandesPage from './pages/dashboard/CommandesPage';
import CommandeDetailPage from './pages/dashboard/CommandeDetailPage';
import PaiementsPage from './pages/dashboard/PaiementsPage';
import RetoursPage from './pages/dashboard/RetoursPage';
import RetourDetailPage from './pages/dashboard/RetourDetailPage';
import NouveauRetourPage from './pages/dashboard/NouveauRetourPage';   // ← NOUVEAU

export const router = createBrowserRouter([
    // ============================================================
    // Routes publiques
    // ============================================================
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
        ],
    },

    // ============================================================
    // Routes privées
    // ============================================================
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: '/dashboard',
                element: <DashboardLayout />,
                children: [
                    // ============================================
                    // Vue globale
                    // ============================================
                    { index: true, element: <DashboardHomePage /> },
                    { path: 'users', element: <UsersPage /> },
                    {
                        path: 'stats',
                        element: (
                            <PlaceholderPage
                                title="Statistiques"
                                icon="chart"
                                description="Module à venir"
                            />
                        ),
                    },

                    // ============================================
                    // Vue inspection (SUPER_ADMIN dans une boutique)
                    // ============================================
                    {
                        path: 'users/:userId',
                        children: [
                            { index: true, element: <AdminBoutiqueHomePage /> },
                            { path: 'entreprise', element: <MonEntreprisePage /> },
                            {
                                path: 'profil',
                                element: (
                                    <PlaceholderPage
                                        title="Profil"
                                        icon="userGroup"
                                        description="À venir"
                                    />
                                ),
                            },
                            {
                                path: 'users',
                                element: (
                                    <PlaceholderPage
                                        title="USERs"
                                        icon="userGroup"
                                        description="À venir"
                                    />
                                ),
                            },
                            { path: 'categories', element: <CategoriesPage /> },
                            { path: 'produits', element: <ProduitsPage /> },
                            { path: 'produits/:id', element: <ProduitDetailPage /> },
                            { path: 'clients', element: <ClientsPage /> },
                            { path: 'fournisseurs', element: <FournisseursPage /> },
                            { path: 'commandes', element: <CommandesPage /> },
                            { path: 'commandes/:id', element: <CommandeDetailPage /> },
                            { path: 'paiements', element: <PaiementsPage /> },
                            // ⚠️ ORDRE : 'nouveau' AVANT ':id'
                            { path: 'retours', element: <RetoursPage /> },
                            { path: 'retours/nouveau', element: <NouveauRetourPage /> },   // ← FIX
                            { path: 'retours/:id', element: <RetourDetailPage /> },
                        ],
                    },

                    // ============================================
                    // Vue directe (ADMIN / USER / SELLER)
                    // ============================================
                    { path: 'entreprise', element: <MonEntreprisePage /> },
                    { path: 'categories', element: <CategoriesPage /> },
                    { path: 'produits', element: <ProduitsPage /> },
                    { path: 'produits/:id', element: <ProduitDetailPage /> },
                    { path: 'clients', element: <ClientsPage /> },
                    { path: 'fournisseurs', element: <FournisseursPage /> },
                    { path: 'commandes', element: <CommandesPage /> },
                    { path: 'commandes/:id', element: <CommandeDetailPage /> },
                    { path: 'paiements', element: <PaiementsPage /> },
                    // ⚠️ ORDRE : 'nouveau' AVANT ':id'
                    { path: 'retours', element: <RetoursPage /> },
                    { path: 'retours/nouveau', element: <NouveauRetourPage /> },   // ← FIX
                    { path: 'retours/:id', element: <RetourDetailPage /> },
                    {
                        path: 'achats',
                        element: (
                            <PlaceholderPage
                                title="Achats"
                                icon="shoppingBag"
                                description="À venir"
                            />
                        ),
                    },
                ],
            },
        ],
    },

    // ============================================================
    // 404
    // ============================================================
    { path: '*', element: <NotFoundPage /> },
]);