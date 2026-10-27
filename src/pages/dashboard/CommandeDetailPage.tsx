import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    TruckIcon,
    DocumentTextIcon,
    BanknotesIcon,
    PlusIcon,
    ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { commandeService } from '../../services/commandeService';
import { paiementService } from '../../services/paiementService';
import { retourService } from '../../services/retourService';
import { factureService } from '../../services/factureService';
import { useAuthStore } from '../../stores/authStore';
import {
    isUser as checkIsUser,
    isSeller as checkIsSeller,
} from '../../types/auth';
import {
    getStatutOption,
    TRANSITIONS_AUTORISEES,
    type CommandeResponse,
    type StatutCommande,
} from '../../types/commande';
import {
    METHODES_PAIEMENT,
    ETAT_SOLDE_LABELS,
    getEtatSolde,
    getMethodeOption,
    getStatutPaiementOption,
    type MethodePaiement,
    type PaiementResponse,
    type ResteAPayer,
} from '../../types/paiement';
import {
    getStatutRetourOption,
    type RetourResponse,
} from '../../types/retour';

interface ApiError {
    response?: { data?: { message?: string } };
}

export default function CommandeDetailPage() {
    const { id, userId } = useParams<{ id: string; userId?: string }>();
    const navigate = useNavigate();
    const commandeId = Number(id);
    const isInspection = !!userId;

    const basePath = isInspection
        ? `/dashboard/users/${userId}/commandes`
        : '/dashboard/commandes';

    const factureBasePath = isInspection
        ? `/dashboard/users/${userId}/factures`
        : '/dashboard/factures';

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;
    const canDelete = checkIsUser(roles) && !isInspection;

    const [commande, setCommande] = useState<CommandeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [paiements, setPaiements] = useState<PaiementResponse[]>([]);
    const [reste, setReste] = useState<ResteAPayer | null>(null);
    const [retours, setRetours] = useState<RetourResponse[]>([]);
    const [factureId, setFactureId] = useState<number | null>(null);

    const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);
    const [paiementSubmitting, setPaiementSubmitting] = useState(false);

    // ⚠️ State modifié pour accepter '' (chaîne vide)
    const [paiementForm, setPaiementForm] = useState<{
        montant: number | '';
        methode: MethodePaiement;
        reference: string;
        notes: string;
    }>({
        montant: '',
        methode: 'ESPECES',
        reference: '',
        notes: '',
    });

    // ============================================================
    // Chargements
    // ============================================================
    const loadCommande = useCallback(async (): Promise<void> => {
        if (!id || Number.isNaN(commandeId)) {
            setError('Identifiant de commande invalide');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await commandeService.getCommandeById(commandeId);
            setCommande(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Commande introuvable');
        } finally {
            setLoading(false);
        }
    }, [commandeId, id]);

    useEffect(() => { void loadCommande(); }, [loadCommande]);

    const loadPaiements = useCallback(async (): Promise<void> => {
        if (!commandeId || Number.isNaN(commandeId)) return;
        try {
            const [list, r] = await Promise.all([
                paiementService.getByCommande(commandeId),
                paiementService.getResteAPayer(commandeId),
            ]);
            setPaiements(list);
            setReste(r);
        } catch (err) { console.warn(err); }
    }, [commandeId]);

    useEffect(() => { void loadPaiements(); }, [loadPaiements]);

    const loadRetours = useCallback(async (): Promise<void> => {
        if (!commandeId || Number.isNaN(commandeId)) return;
        try {
            const list = await retourService.getByCommande(commandeId);
            setRetours(list);
        } catch (err) { console.warn(err); }
    }, [commandeId]);

    useEffect(() => { void loadRetours(); }, [loadRetours]);

    useEffect(() => {
        if (commande?.statut === 'LIVREE') {
            factureService.getByCommande(commande.id)
                .then((f) => setFactureId(f.id))
                .catch(() => setFactureId(null));
        }
    }, [commande?.statut, commande?.id]);

    // ============================================================
    // Actions
    // ============================================================
    const handleChangerStatut = async (nouveauStatut: StatutCommande): Promise<void> => {
        if (!commande) return;
        if (!confirm(`Passer la commande à "${nouveauStatut}" ?`)) return;
        try {
            setActionLoading(true);
            const updated = await commandeService.changerStatut(commande.id, nouveauStatut);
            setCommande(updated);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!commande) return;
        if (!confirm(`Supprimer définitivement la commande ${commande.numero} ?`)) return;
        try {
            await commandeService.deleteCommande(commande.id);
            navigate(basePath);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        }
    };

    const handleCreerFacture = async (): Promise<void> => {
        if (!commande) return;
        try {
            setActionLoading(true);
            const facture = await factureService.createFacture({ commandeId: commande.id });
            navigate(`${factureBasePath}/${facture.id}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================================
    // Paiement
    // ============================================================
    const openPaiementModal = (): void => {
        setPaiementForm({
            montant: reste?.resteAPayer ?? '',
            methode: 'ESPECES',
            reference: '',
            notes: '',
        });
        setIsPaiementModalOpen(true);
    };

    const handleCreatePaiement = async (): Promise<void> => {
        if (!commande) return;

        const montantToSend = Number(paiementForm.montant) || 0;

        if (montantToSend <= 0) {
            alert('Le montant doit être supérieur à 0');
            return;
        }
        if (reste && montantToSend > reste.resteAPayer) {
            alert(`Le montant dépasse le reste à payer (${reste.resteAPayer.toLocaleString('fr-FR')} FCFA)`);
            return;
        }

        try {
            setPaiementSubmitting(true);
            await paiementService.createPaiement({
                commandeId: commande.id,
                montant: montantToSend,
                methode: paiementForm.methode,
                reference: paiementForm.reference.trim() || undefined,
                notes: paiementForm.notes.trim() || undefined,
            });
            setIsPaiementModalOpen(false);
            await Promise.all([loadCommande(), loadPaiements()]);
        } catch (err: unknown) {
            const e = err as ApiError;
            alert(e.response?.data?.message || 'Erreur');
        } finally {
            setPaiementSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <button onClick={() => navigate(basePath)} className="mt-4 text-sm text-red-700 underline">
                        Retour aux commandes
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) return null;

    const statut = getStatutOption(commande.statut);
    const transitions = TRANSITIONS_AUTORISEES[commande.statut];
    const etatSolde = getEtatSolde(reste);
    const soldeInfo = ETAT_SOLDE_LABELS[etatSolde];

    const quantitesRetournees = new Map<number, number>();
    retours.forEach((r) => {
        if (r.statut === 'REFUSE') return;
        r.lignes.forEach((l) => {
            quantitesRetournees.set(l.produitId, (quantitesRetournees.get(l.produitId) || 0) + l.quantite);
        });
    });

    const peutFaireRetour =
        commande.statut === 'LIVREE' &&
        commande.lignes.some((l) => (quantitesRetournees.get(l.produitId) || 0) < l.quantite);

    return (
        <div className="p-8">
            {/* ... (En-tête, Actions, Lignes inchangés) ... */}

            {/* Reprise à la partie Paiements pour le modal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5 text-primary-600" />
                        Paiements ({paiements.length})
                    </h2>
                    {canEdit && reste && !reste.solde && commande.statut !== 'ANNULEE' && (
                        <Button size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={openPaiementModal}>
                            Enregistrer un paiement
                        </Button>
                    )}
                </div>

                {reste && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total TTC</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{reste.totalTTC.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Déjà payé</p>
                                <p className="text-lg font-bold text-green-600 mt-1">{reste.totalPaye.toLocaleString('fr-FR')} FCFA</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Reste à payer</p>
                                <p className={`text-lg font-bold mt-1 ${reste.solde ? 'text-green-600' : 'text-red-600'}`}>
                                    {reste.resteAPayer.toLocaleString('fr-FR')} FCFA
                                </p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all" style={{ width: `${reste.totalTTC > 0 ? Math.min(100, (reste.totalPaye / reste.totalTTC) * 100) : 0}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {reste.totalTTC > 0 ? Math.round((reste.totalPaye / reste.totalTTC) * 100) : 0}% payé
                            </p>
                        </div>
                    </>
                )}

                {paiements.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-6 text-center">Aucun paiement enregistré</p>
                ) : (
                    <div className="space-y-2">
                        {paiements.map((p) => {
                            const pStatut = getStatutPaiementOption(p.statut);
                            const methode = getMethodeOption(p.methode);
                            return (
                                <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                                        {methode.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-mono font-medium text-gray-900">{p.numero}</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pStatut.color}`}>
                                                {pStatut.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {methode.label}{p.reference && ` • Réf : ${p.reference}`}{' • '}
                                            {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">{p.montant.toLocaleString('fr-FR')} FCFA</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Paiement (Modifié) */}
            <Modal
                isOpen={isPaiementModalOpen}
                onClose={() => setIsPaiementModalOpen(false)}
                title="Enregistrer un paiement"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsPaiementModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreatePaiement} loading={paiementSubmitting}>Enregistrer</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                        {/* ⚠️ INPUT MODIFIÉ */}
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paiementForm.montant}
                            onChange={(e) =>
                                setPaiementForm({
                                    ...paiementForm,
                                    montant: e.target.value === '' ? '' : Number(e.target.value),
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {reste && (
                            <p className="mt-1 text-xs text-gray-500">
                                Reste à payer : <strong>{reste.resteAPayer.toLocaleString('fr-FR')} FCFA</strong>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Méthode *</label>
                        <select
                            value={paiementForm.methode}
                            onChange={(e) => setPaiementForm({ ...paiementForm, methode: e.target.value as MethodePaiement })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            {METHODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                        <input
                            type="text"
                            value={paiementForm.reference}
                            onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={paiementForm.notes}
                            onChange={(e) => setPaiementForm({ ...paiementForm, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}