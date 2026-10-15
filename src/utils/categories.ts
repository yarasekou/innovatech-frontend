import type { CategorieResponse } from '../types/categorie';

/**
 * Retourne la liste des IDs de la catégorie donnée + tous ses descendants.
 */
export function getCategorieAndDescendants(
    categorieId: number,
    allCategories: CategorieResponse[]
): number[] {
    const ids = new Set<number>();
    ids.add(categorieId);

    // Chercher récursivement les enfants
    const findChildren = (parentId: number) => {
        allCategories
            .filter((c) => c.parentId === parentId)
            .forEach((child) => {
                if (!ids.has(child.id)) {
                    ids.add(child.id);
                    findChildren(child.id);
                }
            });
    };

    findChildren(categorieId);

    return Array.from(ids);
}