import { useState } from 'react';
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import { categorieService } from '../services/categorieService';
import type { CategorieResponse } from '../types/categorie';

interface ApiError {
    response?: { data?: { message?: string } };
}

interface CategorieQuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Catégorie parente optionnelle (pour créer une sous-catégorie) */
    parentId?: number | null;
    /** Callback après création réussie */
    onCreated: (categorie: CategorieResponse) => void;
    /** Liste des catégories existantes pour afficher le parent */
    categories: CategorieResponse[];
}

export default function CategorieQuickCreateModal({
                                                      isOpen,
                                                      onClose,
                                                      parentId = null,
                                                      onCreated,
                                                      categories,
                                                  }: CategorieQuickCreateModalProps) {
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<number | null>(parentId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const parent = selectedParentId
        ? categories.find((c) => c.id === selectedParentId)
        : null;

    const reset = () => {
        setNom('');
        setDescription('');
        setSelectedParentId(parentId);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!nom.trim()) {
            alert('Le nom est obligatoire');
            return;
        }

        try {
            setIsSubmitting(true);
            const created = await categorieService.createCategorie({
                nom: nom.trim(),
                description: description.trim() || undefined,
                parentId: selectedParentId,
                actif: true,
            });
            onCreated(created);
            handleClose();
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Créer une catégorie"
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        icon={<PlusIcon className="h-4 w-4" />}
                    >
                        Créer
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Info parent */}
                {parent && (
                    <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
                        <TagIcon className="h-4 w-4" />
                        <span>
                            Sous-catégorie de <strong>{parent.nom}</strong>
                        </span>
                    </div>
                )}

                {/* Nom */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex : HP"
                        maxLength={150}
                        autoFocus
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Optionnel…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Parent */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie parente
                    </label>
                    <select
                        value={selectedParentId || ''}
                        onChange={(e) =>
                            setSelectedParentId(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">Aucune (catégorie racine)</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.cheminComplet || c.nom}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </Modal>
    );
}