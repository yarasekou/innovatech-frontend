import { useState } from 'react';
import { TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { getFullUrl } from '../utils/url';
import type { PhotoProduit } from '../types/photo';

const DEFAULT_IMAGE = '/img.jpg';
interface PhotoGalleryProps {
    photos: PhotoProduit[] | null | undefined;
    canEdit: boolean;
    onDelete?: (photoId: number) => void;
    onSetPrincipale?: (photoId: number) => void;
}

export default function PhotoGallery({
                                         photos,
                                         canEdit,
                                         onDelete,
                                         onSetPrincipale,
                                     }: PhotoGalleryProps) {
    const [lightbox, setLightbox] = useState<PhotoProduit | null>(null);

    // ⚠️ Si pas de photos, on affiche la photo par défaut
    const safePhotos = photos && photos.length > 0
        ? photos
        : [
            {
                id: 0,
                produitId: 0,
                url: DEFAULT_IMAGE,
                nomFichier: 'default',
                titre: 'Aucune image',
                principale: true,
                ordre: 0,
                taille: 0,
                typeMime: 'image/svg+xml',
                dateCreation: new Date().toISOString(),
            },
        ];

    return (
        <>
            {safePhotos.map((photo) => {
                const isDefault = photo.id === 0;

                return (
                    <div
                        key={photo.id}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white"
                    >
                        <img
                            src={isDefault ? photo.url : getFullUrl(photo.url)}
                            alt={photo.titre || photo.nomFichier}
                            className={`w-full h-full object-cover ${isDefault ? 'p-8 opacity-50' : 'cursor-pointer'}`}
                            onClick={() => !isDefault && setLightbox(photo)}
                            onError={(e) => {
                                // Si l'image plante, on met le placeholder
                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                            }}
                        />

                        {!isDefault && photo.principale && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                <StarSolid className="h-3 w-3" />
                                Principale
                            </div>
                        )}

                        {canEdit && !isDefault && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!photo.principale && onSetPrincipale && (
                                    <button
                                        onClick={() => onSetPrincipale(photo.id)}
                                        className="p-2 bg-white text-yellow-600 rounded-lg hover:bg-yellow-50"
                                        title="Définir comme principale"
                                    >
                                        <StarIcon className="h-5 w-5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Supprimer cette photo ?')) {
                                                onDelete(photo.id);
                                            }
                                        }}
                                        className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <img
                        src={getFullUrl(lightbox.url)}
                        alt={lightbox.titre || lightbox.nomFichier}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </>
    );
}