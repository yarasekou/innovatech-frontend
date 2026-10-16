import { useState } from 'react';
import { TrashIcon, StarIcon, CubeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { getFullUrl } from '../utils/url';
import type { PhotoProduit } from '../types/photo';

interface PhotoGalleryProps {
    photos: PhotoProduit[] | null | undefined;   // ← accepte null/undefined
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

    // ⚠️ GUARD : photos peut être null ou undefined
    const safePhotos = photos ?? [];

    if (safePhotos.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 col-span-full">
                <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune photo</p>
            </div>
        );
    }

    return (
        <>
            {safePhotos.map((photo) => (
                <div
                    key={photo.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white"
                >
                    <img
                        src={getFullUrl(photo.url)}
                        alt={photo.titre || photo.nomFichier}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightbox(photo)}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" fill="%239ca3af"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                    />

                    {photo.principale && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                            <StarSolid className="h-3 w-3" />
                            Principale
                        </div>
                    )}

                    {canEdit && (
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
            ))}

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