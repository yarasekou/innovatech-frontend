import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ArrowUturnLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { commandeService } from '../../services/commandeService';
import { retourService } from '../../services/retourService';
import type { CommandeResponse } from '../../types/commande';
import type { StatutRetour } from '../../types/retour';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

interface LigneDraft {
    produitId: number;
    produitNom: string;
    produitReference: string;
    quantiteCommandee: number;
    quantiteDejaRetournee: number;
    quantiteARetourner: number;
    prixUnitaire: number;
    raison: string;
}

// ============================================================
// Composant
// ============================================================

export default function NouveauRetourPage() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isInspection = !!userId;

    const commandeId = searchParams.get('commandeId')
        ? Number(searchParams.get('commandeId'))
        : null;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/retours`
        : '/dashboard/retours';

    // ============================================================
    // State
    // ============================================================
    const [commande, setCommande] = useState<CommandeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [motif, setMotif] = useState('');
    const [notes, setNotes] = useState('');
    const [lignes, setLignes] = useState<LigneDraft[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ============================================================
    // Charger commande + retours existants
    // ============================================================
    const loadData = useCallback(async (): Promise<void> => {
        // ⚠️ GUARD
        if (!commandeId || Number.isNaN(commandeId)) {
            setError('Identifiant de commande manquant ou invalide');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Charger la commande ET les retours existants en parallèle
            const [cmd, retoursExistants] = await Promise.all([
                commandeService.getCommandeById(commandeId),
                retourService.getByCommande(commandeId),
            ]);

            setCommande(cmd);

            // Calculer les quantités déjà retournées par produit
            const dejaRetourneMap = new Map<number, number>();
            retoursExistants.forEach((r) => {
                // Ignorer les retours refusés
                if (r.statut === 'REFUSE') return;
                r.lignes.forEach((l) => {
                    dejaRetourneMap.set(
                        l.produitId,
                        (dejaRetourneMap.get(l.produitId) || 0) + l.quantite
                    );
                });
            });

            // Construire les lignes draft (une par ligne de commande)
            const initialLignes: LigneDraft[] = cmd.lignes.map((l) => {
                const deja = dejaRetourneMap.get(l.produitId) || 0;
                const restant = l.quantite - deja;
                return {
                    produitId: l.produitId,
                    produitNom: l.produitNom,
                    produitReference: l.produitReference,
                    quantiteCommandee: l.quantite,
                    quantiteDejaRetournee: deja,
                    quantiteARetourner: 0,   // par défaut : rien à retourner
                    prixUnitaire: l.prixUnitaire,
                    raison: '',
                };
            });

            setLignes(initialLignes);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [commandeId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // ============================================================
    // Totaux
    // ============================================================
    const montantTotal = useMemo(() => {
        return lignes.reduce(
            (sum, l) => sum + l.quantiteARetourner * l.prixUnitaire,
            0
        );
    }, [lignes]);

    const nbLignesSelectionnees = useMemo(
        () => lignes.filter((l) => l.quantiteARetourner > 0).length,
        [lignes]
    );

    // ============================================================
    // Handlers
    // ============================================================
    const updateLigne = (index: number, patch: Partial<LigneDraft>) => {
        setLignes((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const handleQuantiteChange = (index: number, value: number) => {
        const ligne = lignes[index];
        const restant = ligne.quantiteCommandee - ligne.quantiteDejaRetournee;
        const quantite = Math.max(0, Math.min(value, restant));
        updateLigne(index, { quantiteARetourner: quantite });
    };

    const handleRaisonChange = (index: number, value: string) => {
        updateLigne(index, { raison: value });
    };

    // ============================================================
    // Submit
    // ============================================================
    const handleSubmit = async (): Promise<void> => {
        if (!commande) return;

        if (!motif.trim()) {
            alert('Le motif est obligatoire');
            return;
        }

        const lignesValides = lignes.filter((l) => l.quantiteARetourner > 0);
        if (lignesValides.length === 0) {
            alert('Sélectionnez au moins un produit à retourner');
            return;
        }

        try {
            setIsSubmitting(true);
            const created = await retourService.createRetour({
                commandeId: commande.id,
                motif: motif.trim(),
                notes: notes.trim() || undefined,
                lignes: lignesValides.map((l) => ({
                    produitId: l.produitId,
                    quantite: l.quantiteARetourner,
                    raison: l.raison.trim() || undefined,
                })),
            });

            // Rediriger vers le détail du retour créé
            const detailPath = isInspection
                ? `/dashboard/users/${userId}/retours/${created.id}`
                : `/dashboard/retours/${created.id}`;
            navigate(detailPath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================================
    // Rendu — loading / error
    // ============================================================
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => navigate(basePath)}
                        className="mt-4 text-sm text-red-700 underline"
                    >
                        Retour aux retours
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) return null;

    // Vérifier que la commande est LIVREE
    if (commande.statut !== 'LIVREE') {
        return (
            <div className="p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <p className="text-yellow-800 font-medium">
                        Seule une commande livrée peut faire l'objet d'un retour
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                        Cette commande est actuellement en statut{' '}
                        <strong>{commande.statut}</strong>.
                    </p>
                    <button
                        onClick={() => navigate(basePath)}
                        className="mt-4 text-sm text-yellow-800 underline"
                    >
                        Retour aux retours
                    </button>
                </div>
            </div>
        );
    }

    // Vérifier qu'il reste des produits à retourner
    const aucunProduitRetournable = lignes.every(
        (l) => l.quantiteCommandee - l.quantiteDejaRetournee <= 0
    );

    if (aucunProduitRetournable) {
        return (
            <div className="p-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-800 font-medium">
                        Tous les produits de cette commande ont déjà été retournés
                    </p>
                    <button
                        onClick={() => navigate(basePath)}
                        className="mt-4 text-sm text-blue-700 underline"
                    >
                        Retour aux retours
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================
    // Rendu principal
    // ============================================================
    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Retour */}
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux retours
            </button>

            <PageHeader
                title="Nouveau retour"
                subtitle={`Pour la commande ${commande.numero}`}
            />

            {/* Récap commande */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                            Commande
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1 font-mono">
                            {commande.numero}
                        </p>
                    </div>
                    {commande.client && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">
                                Client
                            </p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {commande.client.prenom} {commande.client.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                                {commande.client.email}
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                            Total commande
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                            {commande.totalTTC.toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>
                </div>
            </div>

            {/* Motif + Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations du retour
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motif <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            placeholder="Ex : Produit défectueux, Erreur de livraison, Ne correspond pas…"
                            maxLength={500}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {motif.length} / 500 caractères
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes internes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Notes internes (non visibles par le client)…"
                            maxLength={1000}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Lignes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Produits à retourner
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Indiquez la quantité à retourner pour chaque produit.
                    </p>
                </div>

                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Produit
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Commandé
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Déjà retourné
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Restant
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            À retourner
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Sous-total
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {lignes.map((ligne, index) => {
                        const restant =
                            ligne.quantiteCommandee - ligne.quantiteDejaRetournee;
                        const sousTotal = ligne.quantiteARetourner * ligne.prixUnitaire;
                        const nonRetournable = restant <= 0;
                        const selectionne = ligne.quantiteARetourner > 0;

                        return (
                            <tr
                                key={ligne.produitId}
                                className={
                                    nonRetournable
                                        ? 'bg-gray-50 opacity-60'
                                        : selectionne
                                            ? 'bg-primary-50/30'
                                            : ''
                                }
                            >
                                <td className="px-6 py-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {ligne.produitNom}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        {ligne.produitReference}
                                    </p>
                                    {selectionne && (
                                        <input
                                            type="text"
                                            value={ligne.raison}
                                            onChange={(e) =>
                                                handleRaisonChange(index, e.target.value)
                                            }
                                            placeholder="Raison spécifique (optionnel)…"
                                            maxLength={500}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                        />
                                    )}
                                </td>
                                <td className="px-6 py-3 text-center text-sm text-gray-700">
                                    {ligne.quantiteCommandee}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {ligne.quantiteDejaRetournee > 0 ? (
                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            {ligne.quantiteDejaRetournee}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span
                                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                            nonRetournable
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}
                                    >
                                        {nonRetournable ? 'Tout' : restant}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <input
                                        type="number"
                                        min={0}
                                        max={restant}
                                        value={ligne.quantiteARetourner}
                                        onChange={(e) =>
                                            handleQuantiteChange(
                                                index,
                                                Number(e.target.value) || 0
                                            )
                                        }
                                        disabled={nonRetournable}
                                        className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                    {sousTotal.toLocaleString('fr-FR')} FCFA
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Récap + Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                            Montant du retour
                        </p>
                        <p className="text-3xl font-bold text-primary-600 mt-1">
                            {montantTotal.toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {nbLignesSelectionnees} produit
                            {nbLignesSelectionnees > 1 ? 's' : ''} sélectionné
                            {nbLignesSelectionnees > 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => navigate(basePath)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={nbLignesSelectionnees === 0 || !motif.trim()}
                            icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
                        >
                            Créer le retour
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}