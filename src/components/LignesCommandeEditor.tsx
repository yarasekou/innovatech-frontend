import { PlusIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { getFullUrl } from '../utils/url';
import type { ProduitResponse } from '../types/produit';

export interface LigneDraft {
    produitId: number | null;
    quantite: number;
}

interface LignesCommandeEditorProps {
    lignes: LigneDraft[];
    produits: ProduitResponse[];
    onChange: (lignes: LigneDraft[]) => void;
    disabled?: boolean;
}

export default function LignesCommandeEditor({
                                                 lignes,
                                                 produits,
                                                 onChange,
                                                 disabled = false,
                                             }: LignesCommandeEditorProps) {

    const produitsMap = useMemo(() => {
        const map = new Map<number, ProduitResponse>();
        produits.forEach((p) => map.set(p.id, p));
        return map;
    }, [produits]);

    // ⚠️ Set des produits déjà utilisés (pour désactiver dans le select)
    const produitsDejaUtilises = useMemo(() => {
        const set = new Set<number>();
        lignes.forEach((l) => {
            if (l.produitId) set.add(l.produitId);
        });
        return set;
    }, [lignes]);

    const addLigne = () => {
        onChange([...lignes, { produitId: null, quantite: 1 }]);
    };

    const removeLigne = (index: number) => {
        onChange(lignes.filter((_, i) => i !== index));
    };

    const updateLigne = (index: number, patch: Partial<LigneDraft>) => {
        const next = [...lignes];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    /**
     * ⚠️ Change le produit d'une ligne.
     * Si le produit est déjà utilisé sur une AUTRE ligne → on fusionne :
     *   - la ligne courante est supprimée
     *   - les quantités sont additionnées sur la ligne existante
     */
    const handleProduitChange = (index: number, nouveauProduitId: number | null) => {
        if (nouveauProduitId === null) {
            updateLigne(index, { produitId: null });
            return;
        }

        // Cherche une autre ligne qui utilise déjà ce produit
        const ligneExistanteIndex = lignes.findIndex(
            (l, i) => i !== index && l.produitId === nouveauProduitId
        );

        if (ligneExistanteIndex !== -1) {
            // Fusion : additionner les quantités
            const nouvelleQuantite =
                lignes[ligneExistanteIndex].quantite + lignes[index].quantite;

            const next = [...lignes];
            next[ligneExistanteIndex] = {
                ...next[ligneExistanteIndex],
                quantite: nouvelleQuantite,
            };
            // Supprimer la ligne courante
            next.splice(index, 1);
            onChange(next);
        } else {
            updateLigne(index, { produitId: nouveauProduitId });
        }
    };

    const totalHT = lignes.reduce((sum, l) => {
        if (!l.produitId) return sum;
        const produit = produitsMap.get(l.produitId);
        if (!produit) return sum;
        return sum + produit.prix * l.quantite;
    }, 0);

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {lignes.map((ligne, index) => {
                    const produit = ligne.produitId ? produitsMap.get(ligne.produitId) : null;
                    const sousTotal = produit ? produit.prix * ligne.quantite : 0;

                    return (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                            {/* Photo produit */}
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {produit?.photoPrincipale ? (
                                    <img
                                        src={getFullUrl(produit.photoPrincipale)}
                                        alt={produit.nom}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Cache l'image cassée
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            // Affiche l'icône de repli
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                parent.innerHTML = '';
                                                const icon = document.createElement('div');
                                                icon.innerHTML = '📦';
                                                icon.className = 'text-gray-400';
                                                parent.appendChild(icon);
                                            }
                                        }}
                                    />
                                ) : (
                                    <CubeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </div>

                            {/* Sélection produit */}
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
                                    // Désactiver si déjà utilisé AILLEURS
                                    const disabledOption = dejaUtilise && !estCourant;

                                    return (
                                        <option
                                            key={p.id}
                                            value={p.id}
                                            disabled={disabledOption || p.stock === 0}
                                        >
                                            {p.nom} ({p.reference}) — {p.prix.toLocaleString('fr-FR')} FCFA
                                            {p.stock === 0
                                                ? ' (rupture)'
                                                : disabledOption
                                                    ? ' (déjà ajouté)'
                                                    : ` — stock ${p.stock}`}
                                        </option>
                                    );
                                })}
                            </select>

                            {/* Quantité */}
                            <input
                                type="number"
                                min={1}
                                max={produit?.stock || undefined}
                                value={ligne.quantite}
                                onChange={(e) =>
                                    updateLigne(index, {
                                        quantite: Math.max(1, Number(e.target.value) || 1),
                                    })
                                }
                                disabled={disabled}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-center"
                            />

                            {/* Sous-total */}
                            <div className="w-28 text-right text-sm font-medium text-gray-900">
                                {sousTotal.toLocaleString('fr-FR')} FCFA
                            </div>

                            {/* Suppression */}
                            <button
                                type="button"
                                onClick={() => removeLigne(index)}
                                disabled={disabled}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Supprimer la ligne"
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
    );
}