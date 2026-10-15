export default function DashboardHomePage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Tableau de bord
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Commandes', value: '0', color: 'bg-blue-500' },
                    { label: 'Produits', value: '0', color: 'bg-green-500' },
                    { label: 'Clients', value: '0', color: 'bg-purple-500' },
                    { label: 'CA du mois', value: '0 FCFA', color: 'bg-orange-500' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                    >
                        <div className={`w-12 h-12 ${stat.color} rounded-lg mb-4`}></div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-gray-500 text-center py-12">
                    🚧 Contenu à venir dans les prochaines étapes
                </p>
            </div>
        </div>
    );
}