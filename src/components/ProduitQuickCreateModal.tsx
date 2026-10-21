import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import CategorieTreeSelect from './CategorieTreeSelect'; // ⚠️ NOUVEAU
import CategorieQuickCreateModal from './CategorieQuickCreateModal';
import { produitService } from '../services/produitService';
import { useCategories } from '../hooks/useCategories';
import type { ProduitResponse } from '../types/produit';
import type { CategorieResponse } from '../types/categorie';

interface ApiError {
    response?: { data?: { message?: string } };
}

interface ProduitQuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (produit: ProduitResponse) => void;
    defaultPrixAchat?: number;
}

export default function ProduitQuickCreateModal({
                                                    isOpen,
                                                    onClose,
                                                    onCreated,
                                                    defaultPrixAchat = 0,
                                                }: ProduitQuickCreateModalProps) {
    const { categories, reload: reloadCategories } = useCategories();

    const [nom, setNom] = useState('');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [prix, setPrix] = useState(0);
    const [prixAchat, setPrixAchat] = useState(defaultPrixAchat);
    const [stock, setStock] = useState(0);
    const [categorieId, setCategorieId] = useState<number | null>(null);
    const [actif, setActif] = useState(true);

    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNom('');
            setReference('');
            setDescription('');
            setPrix(0);
            setPrixAchat(defaultPrixAchat);
            setStock(0);
            setCategorieId(null);
            setActif(true);
        }
    }, [isOpen, defaultPrixAchat]);

    // Auto-générer la référence
    const suggestedReference = useMemo(() => {
        if (!nom.trim()) return '';
        return nom
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 50);
    }, [nom]);

    useEffect(() => {
        if (!reference && suggestedReference) {
            setReference(suggestedReference);
        }
    }, [suggestedReference, reference]);

    const handleClose = () => {
        onClose();
    };

    const handleCategorieCreated = async (newCat: CategorieResponse) => {
        await reloadCategories();
        setCategorieId(newCat.id);
        setIsCatModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!nom.trim()) {
            alert('Le nom est obligatoire');
            return;
        }
        if (!reference.trim()) {
            alert('La référence est obligatoire');
            return;
        }
        if (prix < 0 || prixAchat < 0 || stock < 0) {
            alert('Les prix et le stock doivent être positifs');
            return;
        }

        try {
            setIsSubmitting(true);
            const created = await produitService.createProduit({
                nom: nom.trim(),
                reference: reference.trim().toUpperCase(),
                description: description.trim() || undefined,
                prix,
                prixAchat,
                stock,
                categorieId: categorieId ?? undefined,
                actif,
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
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Créer un nouveau produit"
                size="2xl"
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
                            Créer le produit
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Nom + Référence */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom *
                            </label>
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                placeholder="Ex : HP Pavilion 15"
                                maxLength={150}
                                autoFocus
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Référence *
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value.toUpperCase())}
                                placeholder="HP-PAV-15"
                                maxLength={50}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                            />
                        </div>
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
                            maxLength={1000}
                            placeholder="Optionnel…"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Catégorie + bouton créer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catégorie
                        </label>
                        <div className="flex gap-2">

                            {/* ⚠️ COMPOSANT ARBRE ICI */}
                            <div className="flex-1">
                                <CategorieTreeSelect
                                    categories={categories}
                                    value={categorieId}
                                    onChange={setCategorieId}
                                    placeholder="Sans catégorie"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCatModalOpen(true)}
                                className="px-3 py-2 border border-dashed border-primary-400 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center gap-1 text-sm whitespace-nowrap"
                                title="Créer une nouvelle catégorie"
                            >
                                <TagIcon className="h-4 w-4" />
                                Nouvelle
                            </button>
                        </div>
                    </div>

                    {/* Prix + Stock */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix vente *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={prix}
                                onChange={(e) => setPrix(Number(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix achat
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={prixAchat}
                                onChange={(e) => setPrixAchat(Number(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock initial
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Marge calculée */}
                    {prix > 0 && prixAchat > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <span className="text-gray-600">Marge unitaire : </span>
                            <span className="font-semibold text-green-600">
                                {(prix - prixAchat).toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="text-gray-500 ml-2">
                                ({prixAchat > 0
                                ? (((prix - prixAchat) / prixAchat) * 100).toFixed(2)
                                : 0}
                                %)
                            </span>
                        </div>
                    )}

                    {/* Actif */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="quick-create-actif"
                            checked={actif}
                            onChange={(e) => setActif(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label
                            htmlFor="quick-create-actif"
                            className="text-sm text-gray-700"
                        >
                            Produit actif
                        </label>
                    </div>

                    {/* Info : photo à ajouter après */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                        💡 <strong>Astuce :</strong> pour ajouter des photos, va ensuite dans
                        le détail du produit après création.
                    </div>
                </div>
            </Modal>

            {/* Sous-modal catégorie */}
            <CategorieQuickCreateModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                onCreated={handleCategorieCreated}
                categories={categories}
                parentId={null}
            />
        </>
    );
}