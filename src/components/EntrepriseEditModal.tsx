import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    BuildingOffice2Icon,
    PhotoIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import { entrepriseService } from '../services/entrepriseService';
import { getFullUrl } from '../utils/url';
import type { EntrepriseResponse } from '../types/entreprise';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

interface EntrepriseEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    entreprise: EntrepriseResponse;
    onUpdated: (updated: EntrepriseResponse) => void;
}

// ============================================================
// Validation
// ============================================================

const entrepriseSchema = z.object({
    nom: z.string().min(2, 'Min 2').max(150, 'Max 150'),
    description: z.string().max(1000, 'Max 1000').optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    telephone: z.string().max(20, 'Max 20').optional(),
    adresse: z.string().max(255, 'Max 255').optional(),
    ville: z.string().max(100, 'Max 100').optional(),
    pays: z.string().max(100, 'Max 100').optional(),
    siret: z.string().max(14, 'Max 14').optional(),
    devise: z.string().max(10, 'Max 10'),
    tvaPercent: z.number().min(0).max(100),
});

type EntrepriseForm = z.infer<typeof entrepriseSchema>;

// ============================================================
// Composant
// ============================================================

export default function EntrepriseEditModal({
                                                isOpen,
                                                onClose,
                                                entreprise,
                                                onUpdated,
                                            }: EntrepriseEditModalProps) {
    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
        entreprise.logoUrl
    );
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EntrepriseForm>({
        resolver: zodResolver(entrepriseSchema),
    });

    // Charger les valeurs initiales à l'ouverture
    useEffect(() => {
        if (isOpen) {
            reset({
                nom: entreprise.nom,
                description: entreprise.description || '',
                email: entreprise.email || '',
                telephone: entreprise.telephone || '',
                adresse: entreprise.adresse || '',
                ville: entreprise.ville || '',
                pays: entreprise.pays || '',
                siret: entreprise.siret || '',
                devise: entreprise.devise,
                tvaPercent: entreprise.tvaPercent,
            });
            setCurrentLogoUrl(entreprise.logoUrl);
        }
    }, [isOpen, entreprise, reset]);

    // ============================================================
    // Submit
    // ============================================================
    const onSubmit = async (data: EntrepriseForm): Promise<void> => {
        try {
            const payload = {
                nom: data.nom.trim(),
                description: data.description?.trim() || undefined,
                email: data.email?.trim() || undefined,
                telephone: data.telephone?.trim() || undefined,
                adresse: data.adresse?.trim() || undefined,
                ville: data.ville?.trim() || undefined,
                pays: data.pays?.trim() || undefined,
                siret: data.siret?.trim() || undefined,
                devise: data.devise.trim(),
                tvaPercent:
                    typeof data.tvaPercent === 'number' && !isNaN(data.tvaPercent)
                        ? data.tvaPercent
                        : 0,
            };

            const updated = await entrepriseService.update(entreprise.id, payload);
            onUpdated(updated);
            onClose();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Logo
    // ============================================================
    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) {
            alert('Type de fichier non autorisé (PNG, JPG, WEBP uniquement)');
            return;
        }

        try {
            setUploadingLogo(true);
            const updated = await entrepriseService.uploadLogo(file);
            setCurrentLogoUrl(updated.logoUrl);
            onUpdated(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur d\'upload');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleDeleteLogo = async (): Promise<void> => {
        if (!currentLogoUrl) return;
        if (!confirm('Supprimer le logo ?')) return;

        try {
            const updated = await entrepriseService.deleteLogo();
            setCurrentLogoUrl(null);
            onUpdated(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Rendu
    // ============================================================
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Modifier l'entreprise"
            size="2xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" form="entreprise-edit-form" loading={isSubmitting}>
                        Enregistrer
                    </Button>
                </>
            }
        >
            <form
                id="entreprise-edit-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5 max-h-[70vh] overflow-y-auto"
            >
                {/* Logo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                    </label>
                    <div className="flex items-center gap-4">
                        {currentLogoUrl ? (
                            <img
                                src={getFullUrl(currentLogoUrl)}
                                alt={entreprise.nom}
                                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleLogoSelect}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<PhotoIcon className="h-4 w-4" />}
                                onClick={() => logoInputRef.current?.click()}
                                loading={uploadingLogo}
                            >
                                {currentLogoUrl ? 'Remplacer' : 'Uploader'}
                            </Button>
                            {currentLogoUrl && (
                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    icon={<TrashIcon className="h-4 w-4" />}
                                    onClick={handleDeleteLogo}
                                >
                                    Supprimer
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Nom */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                    </label>
                    <input
                        {...register('nom')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        {...register('description')}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            {...register('telephone')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                {/* Adresse */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                        {...register('adresse')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                        <input
                            {...register('ville')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <input
                            {...register('pays')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                        <input
                            {...register('siret')}
                            maxLength={14}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                {/* Finance */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                        <input
                            {...register('devise')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
                        <input
                            {...register('tvaPercent', {
                                setValueAs: (v) => (v === '' ? 0 : Number(v)),
                            })}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}