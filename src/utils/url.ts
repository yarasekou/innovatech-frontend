/**
 * Construit l'URL complète d'un fichier uploadé.
 * <p>
 * Exemple :
 *   /api/uploads/produits/xxx.jpg
 *   → http://localhost:8080/api/uploads/produits/xxx.jpg
 */
export function getFullUrl(path: string | null | undefined): string {
    if (!path) return '';

    // Déjà une URL complète
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Préfixer avec l'origine du backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const origin = apiUrl.replace(/\/api\/?$/, '');

    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}