export interface CreateSellerRequest {
    username: string;
    email: string;
    password: string;
    prenom?: string;
    nom?: string;
}

// On réutilise le type UserResponse existant
export type { UserResponse as SellerResponse } from './user';