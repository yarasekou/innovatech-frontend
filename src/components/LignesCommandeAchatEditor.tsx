import { useState, useMemo } from 'react';
import {
    PlusIcon,
    TrashIcon,
    CubeIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { getFullUrl } from '../utils/url';
import ProduitQuickCreateModal from './ProduitQuickCreateModal';
import type { ProduitResponse } from '../types/produit';

export interface LigneAchatDraft {
    produitId: number | null;
    quantite: number;
    prixAchatUnitaire: number;
}

interface Props {
    lignes: LigneAchatDraft[];
    produits: ProduitResponse[];
    onChange: (lignes: LigneAchatDraft[]) => void;
    onProduitCreated?: (produit: ProduitResponse) => void;
    disabled?: boolean;
    /** Pour pré-remplir le prix d'achat lors du quick create */
    defaultPrixAchat?: number;
}

export default function LignesCommandeAchatEditor({
                                                      lignes,
                                                      produits,
                                                      onChange,
                                                      onProduitCreated,
                                                      disabled = false,
                                                      defaultPrixAchat = 0,
                                                  }: Props) {
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [quickCreateForIndex, setQuickCreateForIndex] = useState<number | null>(null);

    const produitsMap = useMemo(() => {
        const map = new Map<number, ProduitResponse>();
        produits.forEach((p) => map.set(p.id, p));
        return map;
    }, [produits]);

    const produitsDejaUtilises = useMemo(() => {
        const set = new Set<number>();
        lignes.forEach((l) => {
            if (l.produitId) set.add(l.produitId);
        });
        return set;
    }, [lignes]);

    const addLigne = () => {
        onChange([
            ...lignes,
            { produitId: null, quantite: 1, prixAchatUnitaire: 0 },
        ]);
    };

    const removeLigne = (index: number) => {
        onChange(lignes.filter((_, i) => i !== index));
    };

    const updateLigne = (index: number, patch: Partial<LigneAchatDraft>) => {
        const next = [...lignes];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const handleProduitChange = (index: number, nouveauProduitId: number | null) => {
        if (nouveauProduitId === null) {
            updateLigne(index, { produitId: null });
            return;
        }

        const existantIndex = lignes.findIndex(
            (l, i) => i !== index && l.produitId === nouveauProduitId
        );

        if (existantIndex !== -1) {
            const next = [...lignes];
            next[existantIndex] = {
                ...next[existantIndex],
                quantite: next[existantIndex].quantite + lignes[index].quantite,
            };
            next.splice(index, 1);
            onChange(next);
        } else {
            // Auto-remplir le prix d'achat par défaut
            const produit = produitsMap.get(nouveauProduitId);
            updateLigne(index, {
                produitId: nouveauProduitId,
                prixAchatUnitaire: produit?.prixAchat ?? 0,
            });
        }
    };

    const openQuickCreate = (index: number) => {
        setQuickCreateForIndex(index);
        setIsQuickCreateOpen(true);
    };

    const handleProduitCreated = (newProduit: ProduitResponse) => {
        // Notifie le parent pour qu'il recharge la liste
        if (onProduitCreated) {
            onProduitCreated(newProduit);
        }
        // Auto-sélectionne dans la ligne
        if (quickCreateForIndex !== null) {
            updateLigne(quickCreateForIndex, {
                produitId: newProduit.id,
                prixAchatUnitaire: newProduit.prixAchat,
            });
        }
        setIsQuickCreateOpen(false);
        setQuickCreateForIndex(null);
    };

    const totalHT = lignes.reduce((sum, l) => {
        if (!l.produitId) return sum;
        return sum + l.prixAchatUnitaire * l.quantite;
    }, 0);

    return (
        <>
            <div className="space-y-3">
                <div className="space-y-2">
                    {lignes.map((ligne, index) => {
                        const produit = ligne.produitId
                            ? produitsMap.get(ligne.produitId)
                            : null;
                        const sousTotal = ligne.prixAchatUnitaire * ligne.quantite;

                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                            >
                                {/* Photo */}
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {produit?.photoPrincipale ? (
                                        <img
                                            src={getFullUrl(produit.photoPrincipale)}
                                            alt={produit.nom}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display =
                                                    'none';
                                            }}
                                        />
                                    ) : (
                                        <CubeIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                {/* Produit */}
                                <select
                                    value={ligne.produitId || ''}
                                    onChange={(e) =>
                                        handleProduitChange(
                                            index,
                                            e.target.value ? Number(e.target.value) : null
                                        )
                                    }
                                    disabled={disabled}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                >
                                    <option value="">-- Choisir un produit --</option>
                                    {produits.map((p) => {
                                        const dejaUtilise = produitsDejaUtilises.has(p.id);
                                        const estCourant = ligne.produitId === p.id;
                                        const disabledOption = dejaUtilise && !estCourant;

                                        return (
                                            <option
                                                key={p.id}
                                                value={p.id}
                                                disabled={disabledOption}
                                            >
                                                {p.nom} ({p.reference})
                                                {disabledOption ? ' (déjà ajouté)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Bouton Quick Create */}
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => openQuickCreate(index)}
                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-300"
                                        title="Créer un nouveau produit"
                                    >
                                        <SparklesIcon className="h-4 w-4" />
                                    </button>
                                )}

                                {/* Prix d'achat */}
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={ligne.prixAchatUnitaire}
                                    onChange={(e) =>
                                        updateLigne(index, {
                                            prixAchatUnitaire: Number(e.target.value) || 0,
                                        })
                                    }
                                    disabled={disabled}
                                    placeholder="Prix achat"
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-right"
                                    title="Prix d'achat unitaire"
                                />

                                {/* Quantité */}
                                <input
                                    type="number"
                                    min={1}
                                    value={ligne.quantite}
                                    onChange={(e) =>
                                        updateLigne(index, {
                                            quantite: Math.max(
                                                1,
                                                Number(e.target.value) || 1
                                            ),
                                        })
                                    }
                                    disabled={disabled}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-center"
                                />

                                {/* Sous-total */}
                                <div className="w-28 text-right text-sm font-medium text-gray-900">
                                    {sousTotal.toLocaleString('fr-FR')}
                                </div>

                                {/* Suppr */}
                                <button
                                    type="button"
                                    onClick={() => removeLigne(index)}
                                    disabled={disabled}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={addLigne}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter une ligne
                </button>

                {lignes.length > 0 && (
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                        <div className="text-sm">
                            <span className="text-gray-600">Total HT provisoire : </span>
                            <span className="font-semibold text-gray-900">
                                {totalHT.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Quick Create */}
            <ProduitQuickCreateModal
                isOpen={isQuickCreateOpen}
                onClose={() => {
                    setIsQuickCreateOpen(false);
                    setQuickCreateForIndex(null);
                }}
                onCreated={handleProduitCreated}
                defaultPrixAchat={defaultPrixAchat}
            />
        </>
    );
}