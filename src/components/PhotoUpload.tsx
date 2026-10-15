import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { photoService } from '../services/photoService';
import type { PhotoProduit } from '../types/photo';

interface PhotoUploadProps {
    produitId: number;
    onUploaded: (photo: PhotoProduit) => void;
    maxPhotos?: number;
    currentCount?: number;
}

export default function PhotoUpload({
                                        produitId,
                                        onUploaded,
                                        maxPhotos = 5,
                                        currentCount = 0,
                                    }: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifier la limite
        if (currentCount >= maxPhotos) {
            setError(`Maximum ${maxPhotos} photos atteint`);
            return;
        }

        // Vérifier le type
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setError(`Type non autorisé : ${file.type}`);
            return;
        }

        // Aperçu local
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setError(null);
        setUploading(true);

        try {
            const photo = await photoService.uploadPhoto(
                produitId,
                file,
                file.name,
                currentCount === 0
            );
            onUploaded(photo);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Erreur d\'upload');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {preview ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
                    {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                        </div>
                    )}
                    {!uploading && (
                        <button
                            onClick={() => {
                                setPreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full text-red-600 hover:bg-red-50"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Ajouter une photo</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {currentCount}/{maxPhotos}
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    );
}