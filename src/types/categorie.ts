// ============================================================
// Requêtes
// ============================================================

export interface CategorieRequest {
    nom: string;
    slug?: string;
    description?: string;
    parentId?: number | null;
    actif?: boolean;
}

// ============================================================
// Réponses
// ============================================================

export interface CategorieResponse {
    id: number;
    nom: string;
    slug: string;
    description: string | null;

    // Hiérarchie
    parentId: number | null;
    parentNom: string | null;
    niveau: number;
    cheminComplet: string | null;

    // Entreprise + User
    entrepriseId: number | null;
    entrepriseNom: string | null;
    userId: number | null;
    userEmail: string | null;

    actif: boolean;
    dateCreation: string;
    dateModification: string;
}

// ============================================================
// Arbre
// ============================================================

export interface CategorieTree {
    id: number;
    nom: string;
    slug: string;
    niveau: number;
    cheminComplet: string | null;
    actif: boolean;
    enfants: CategorieTree[];
}

export interface CategorieOption {
    id: number;
    label: string;   // ex: "── Xiaomi > 30 000 mAh"
    niveau: number;
}

export function buildCategorieOptions(categories: CategorieResponse[]): CategorieOption[] {
    // 1. Créer un map pour retrouver les enfants rapidement
    const childrenMap = new Map<number | null, CategorieResponse[]>();
    categories.forEach((c) => {
        const parentId = c.parentId ?? null;
        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(c);
    });

    // Trier par nom à chaque niveau
    childrenMap.forEach((list) => list.sort((a, b) => a.nom.localeCompare(b.nom)));

    const options: CategorieOption[] = [];

    // 2. Parcours récursif (DFS)
    const walk = (parentId: number | null, depth: number) => {
        const children = childrenMap.get(parentId) || [];
        for (const cat of children) {
            // Créer l'indentation
            // On utilise des espaces insécables pour que le navigateur ne les supprime pas
            const indent = '   '.repeat(depth); // 3 espaces par niveau
            const prefix = depth > 0 ? '└ ' : '';

            options.push({
                id: cat.id,
                label: `${indent}${prefix}${cat.nom}`,
                niveau: depth + 1,
            });

            // Descendre dans les enfants
            walk(cat.id, depth + 1);
        }
    };

    walk(null, 0);
    return options;
}