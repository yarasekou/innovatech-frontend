export interface PhotoProduit {
    id: number;
    produitId: number;
    url: string;
    nomFichier: string;
    titre: string | null;
    principale: boolean;
    ordre: number;
    taille: number;
    typeMime: string;
    dateCreation: string;
}