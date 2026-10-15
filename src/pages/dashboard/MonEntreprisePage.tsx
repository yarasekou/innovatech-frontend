import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    BuildingOffice2Icon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    IdentificationIcon,
    GlobeAltIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import EntrepriseEditModal from '../../components/EntrepriseEditModal';
import { entrepriseService } from '../../services/entrepriseService';
import { adminInspectionService } from '../../services/adminInspectionService';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin as checkIsAdmin } from '../../types/auth';
import { getFullUrl } from '../../utils/url';
import type { EntrepriseResponse } from '../../types/entreprise';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: { data?: { message?: string } };
}

// ============================================================
// Composant principal
// ============================================================

export default function MonEntreprisePage() {
    const { userId } = useParams<{ userId?: string }>();
    const isInspecting = !!userId;

    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = checkIsAdmin(roles) && !isInspecting;

    const [entreprise, setEntreprise] = useState<EntrepriseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // ============================================================
    // Charger l'entreprise
    // ============================================================
    const loadEntreprise = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            let data: EntrepriseResponse;

            if (isInspecting && userId) {
                const profil = await adminInspectionService.getProfil(Number(userId));
                if (!profil.entrepriseId) {
                    throw new Error('Aucune entreprise associée');
                }
                data = await entrepriseService.getById(profil.entrepriseId);
            } else {
                data = await entrepriseService.getMyEntreprise();
            }

            setEntreprise(data);
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e.response?.data?.message || 'Impossible de charger l\'entreprise');
        } finally {
            setLoading(false);
        }
    }, [isInspecting, userId]);

    useEffect(() => {
        void loadEntreprise();
    }, [loadEntreprise]);

    // ============================================================
    // Loading / Error
    // ============================================================
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!entreprise) return null;

    // ============================================================
    // Rendu (commun à tous les rôles + bouton Modifier si ADMIN)
    // ============================================================
    const hasEmail = !!entreprise.email;
    const hasTelephone = !!entreprise.telephone;
    const hasBothContact = hasEmail && hasTelephone;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Présentation de l'entreprise"
                subtitle={
                    canEdit
                        ? 'Informations générales'
                        : 'Informations générales (lecture seule)'
                }
                actions={
                    canEdit ? (
                        <Button
                            icon={<PencilSquareIcon className="h-4 w-4" />}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Modifier
                        </Button>
                    ) : undefined
                }
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* En-tête avec logo */}
                <div className="p-8 bg-gradient-to-br from-primary-50 to-white border-b border-gray-100">
                    <div className="flex items-start gap-6 flex-wrap">
                        {entreprise.logoUrl ? (
                            <img
                                src={getFullUrl(entreprise.logoUrl)}
                                alt={entreprise.nom}
                                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center border-4 border-white shadow-md">
                                <BuildingOffice2Icon className="h-12 w-12 text-primary-600" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {entreprise.nom}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                /{entreprise.slug}
                            </p>
                            {entreprise.description && (
                                <p className="text-base text-gray-700 mt-3 leading-relaxed">
                                    {entreprise.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div className="p-8 space-y-8">
                    {/* Contact */}
                    {(hasEmail || hasTelephone) && (
                        <section>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Contact
                            </h2>
                            <div
                                className={`grid gap-4 ${
                                    hasBothContact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                                }`}
                            >
                                {hasEmail && (
                                    <InfoCard
                                        icon={<EnvelopeIcon className="h-5 w-5" />}
                                        label="Email"
                                        value={entreprise.email!}
                                    />
                                )}
                                {hasTelephone && (
                                    <InfoCard
                                        icon={<PhoneIcon className="h-5 w-5" />}
                                        label="Téléphone"
                                        value={entreprise.telephone!}
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    {/* Adresse */}
                    {(entreprise.adresse || entreprise.ville || entreprise.pays) && (
                        <section>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Adresse
                            </h2>
                            <InfoCard
                                icon={<MapPinIcon className="h-5 w-5" />}
                                label="Adresse complète"
                                value={[
                                    entreprise.adresse,
                                    entreprise.ville,
                                    entreprise.pays,
                                ]
                                    .filter(Boolean)
                                    .join(', ')}
                            />
                        </section>
                    )}

                    {/* Finance */}
                    <section>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Finance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard
                                icon={<CurrencyDollarIcon className="h-5 w-5" />}
                                label="Devise"
                                value={entreprise.devise}
                            />
                            <InfoCard
                                icon={<GlobeAltIcon className="h-5 w-5" />}
                                label="TVA par défaut"
                                value={`${entreprise.tvaPercent} %`}
                            />
                        </div>
                    </section>

                    {/* SIRET */}
                    {entreprise.siret && (
                        <section>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Identification
                            </h2>
                            <InfoCard
                                icon={<IdentificationIcon className="h-5 w-5" />}
                                label="SIRET"
                                value={entreprise.siret}
                            />
                        </section>
                    )}

                    {/* Propriétaire */}
                    {entreprise.ownerEmail && (
                        <section className="pt-6 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {(entreprise.ownerPrenom || '?')[0]}
                      {(entreprise.ownerNom || '?')[0]}
                  </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">
                                        Propriétaire
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {entreprise.ownerPrenom} {entreprise.ownerNom}
                                    </p>
                                    <p className="text-xs text-gray-500">{entreprise.ownerEmail}</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Modal d'édition (ADMIN uniquement) */}
            {canEdit && (
                <EntrepriseEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    entreprise={entreprise}
                    onUpdated={(updated) => setEntreprise(updated)}
                />
            )}
        </div>
    );
}

// ============================================================
// Composant InfoCard
// ============================================================

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function InfoCard({ icon, label, value }: InfoCardProps) {
    return (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="text-primary-600 flex-shrink-0 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-sm text-gray-900 font-medium mt-1 break-words">
                    {value}
                </p>
            </div>
        </div>
    );
}