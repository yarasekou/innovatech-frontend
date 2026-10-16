import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import PhotoGallery from '../../components/PhotoGallery';
import PhotoUpload from '../../components/PhotoUpload';
import { produitService } from '../../services/produitService';
import { photoService } from '../../services/photoService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import { getFullUrl } from '../../utils/url';
import type { ProduitResponse } from '../../types/produit';
import type { PhotoProduit } from '../../types/photo';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Composant
// ============================================================

export default function ProduitDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const produitId = Number(id);

    const isInspection = !!userId;

    // Chemin de base (avec inspection ou non)
    const basePath = isInspection
        ? `/dashboard/users/${userId}/produits`
        : '/dashboard/produits';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;
    const canDelete = checkIsUser(roles) && !isInspection;

    const [produit, setProduit] = useState<ProduitResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================================
    // Charger le produit
    // ============================================================
    const loadProduit = useCallback(async (): Promise<void> => {
        if (!produitId || Number.isNaN(produitId)) {
            setError('Identifiant de produit invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await produitService.getProduitById(produitId);
            setProduit(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Produit introuvable');
        } finally {
            setLoading(false);
        }
    }, [produitId]);

    useEffect(() => {
        void loadProduit();
    }, [loadProduit]);

    // ============================================================
    // Actions photos
    // ============================================================
    const handlePhotoUploaded = (photo: PhotoProduit): void => {
        setProduit((prev) =>
            prev
                ? {
                    ...prev,
                    photos: [...prev.photos, photo],
                    nbPhotos: prev.nbPhotos + 1,
                    photoPrincipale: photo.principale ? photo.url : prev.photoPrincipale,
                }
                : prev
        );
    };

    const handlePhotoDelete = async (photoId: number): Promise<void> => {
        try {
            await photoService.deletePhoto(produitId, photoId);
            await loadProduit();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const handleSetPrincipale = async (photoId: number): Promise<void> => {
        try {
            await photoService.setPrincipale(produitId, photoId);
            await loadProduit();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Actions produit
    // ============================================================
    const handleEdit = (): void => {
        // Redirige vers la liste avec un paramètre ?edit=ID
        // ProduitsPage ouvrira automatiquement le modal
        navigate(`${basePath}?edit=${produit?.id ?? ''}`);
    };

    const handleDeleteProduit = async (): Promise<void> => {
        if (!produit) return;
        const ok = confirm(`Supprimer le produit "${produit.nom}" ?`);
        if (!ok) return;

        try {
            await produitService.deleteProduit(produit.id);
            navigate(basePath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Rendu
    // ============================================================
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => navigate(basePath)}
                        className="mt-4 text-sm text-red-700 underline"
                    >
                        Retour aux produits
                    </button>
                </div>
            </div>
        );
    }

    if (!produit) return null;

    return (
        <div className="p-8">
            {/* Retour */}
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux produits
            </button>

            {/* En-tête */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-start gap-6">
                    {produit.photoPrincipale ? (
                        <img
                            src={getFullUrl(produit.photoPrincipale)}
                            alt={produit.nom}
                            className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                            <CubeIcon className="h-10 w-10 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{produit.nom}</h1>
                        <p className="text-gray-500 mt-1">{produit.reference}</p>
                        {produit.categorieChemin && (
                            <p className="text-sm text-primary-600 mt-2">
                                📁 {produit.categorieChemin}
                            </p>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={<PencilSquareIcon className="h-4 w-4" />}
                            onClick={handleEdit}
                        >
                            Modifier
                        </Button>
                        {canDelete && (
                            <Button
                                variant="danger"
                                icon={<TrashIcon className="h-4 w-4" />}
                                onClick={handleDeleteProduit}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm text-gray-500">Prix de vente</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {produit.prix.toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm text-gray-500">Prix d'achat</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {produit.prixAchat.toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm text-gray-500">Marge unitaire</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                        {produit.margeUnitaire.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {produit.tauxMarge.toFixed(2)} %
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm text-gray-500">Stock</p>
                    <p
                        className={`text-2xl font-bold mt-2 ${
                            produit.stock === 0
                                ? 'text-red-600'
                                : produit.stock < 10
                                    ? 'text-orange-600'
                                    : 'text-gray-900'
                        }`}
                    >
                        {produit.stock}
                    </p>
                    {produit.stock < 10 && produit.stock > 0 && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ Stock faible</p>
                    )}
                    {produit.stock === 0 && (
                        <p className="text-xs text-red-600 mt-1">❌ Rupture</p>
                    )}
                </div>
            </div>

            {/* Description */}
            {produit.description && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{produit.description}</p>
                </div>
            )}

            {/* Photos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Photos ({produit.nbPhotos})
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <PhotoGallery
                        photos={produit.photos}
                        canEdit={canEdit}
                        onDelete={handlePhotoDelete}
                        onSetPrincipale={handleSetPrincipale}
                    />
                    {canEdit && produit.nbPhotos < 5 && (
                        <PhotoUpload
                            produitId={produitId}
                            onUploaded={handlePhotoUploaded}
                            currentCount={produit.nbPhotos}
                            maxPhotos={5}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}