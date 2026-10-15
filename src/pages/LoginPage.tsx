import { Link } from 'react-router-dom';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="text-3xl font-bold text-primary-600">
                        InnovaTech
                    </Link>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Connexion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Page en construction 🚧
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 mb-4">
                        Le formulaire de connexion arrivera à l'Étape 3.
                    </p>
                    <Link
                        to="/"
                        className="text-sm text-primary-600 hover:underline"
                    >
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}