import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary-600">404</h1>
                <p className="mt-4 text-2xl font-semibold text-gray-900">
                    Page introuvable
                </p>
                <p className="mt-2 text-gray-600">
                    La page que vous cherchez n'existe pas.
                </p>
                <Link
                    to="/"
                    className="mt-8 inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
                >
                    Retour à l'accueil
                </Link>
            </div>
        </div>
    );
}