import { useState, useEffect, useCallback } from 'react';
import {
    BuildingOffice2Icon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    IdentificationIcon,
    CurrencyDollarIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { entrepriseService } from '../services/entrepriseService';
import { useAuthStore } from '../stores/authStore';
import { isAdmin as checkIsAdmin } from '../types/auth';
import { getFullUrl } from '../utils/url';
import type { EntrepriseResponse } from '../types/entreprise';

interface EntrepriseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

export default function EntrepriseModal({
                                            isOpen,
                                            onClose,
                                            onEdit,
                                        }: EntrepriseModalProps) {
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = checkIsAdmin(roles) && !!onEdit;

    const [entreprise, setEntreprise] = useState<EntrepriseResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await entrepriseService.getMyEntreprise();
            setEntreprise(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Impossible de charger l\'entreprise');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            void load();
        }
    }, [isOpen, load]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Présentation de l'entreprise"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Fermer
                    </Button>
                    {canEdit && (
                        <Button
                            icon={<PencilSquareIcon className="h-4 w-4" />}
                            onClick={() => {
                                onClose();
                                onEdit?.();
                            }}
                        >
                            Modifier
                        </Button>
                    )}
                </>
            }
        >
            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <div className="p-4 text-center text-red-600 text-sm">{error}</div>
            ) : !entreprise ? (
                <div className="p-4 text-center text-gray-500 text-sm">Aucune entreprise</div>
            ) : (
                <div className="space-y-5">
                    {/* Header avec logo */}
                    <div className="flex items-start gap-4">
                        {entreprise.logoUrl ? (
                            <img
                                src={getFullUrl(entreprise.logoUrl)}
                                alt={entreprise.nom}
                                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-primary-50 flex items-center justify-center">
                                <BuildingOffice2Icon className="h-10 w-10 text-primary-500" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                                {entreprise.nom}
                            </h3>
                            {entreprise.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {entreprise.description}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                /{entreprise.slug}
                            </p>
                        </div>
                    </div>

                    {/* Contact */}
                    {(entreprise.email || entreprise.telephone) && (
                        <div>
                            <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                                Contact
                            </h4>
                            <div className="space-y-2">
                                {entreprise.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{entreprise.email}</span>
                                    </div>
                                )}
                                {entreprise.telephone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span>{entreprise.telephone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Adresse */}
                    {(entreprise.adresse || entreprise.ville || entreprise.pays) && (
                        <div>
                            <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                                Adresse
                            </h4>
                            <div className="flex items-start gap-2 text-sm text-gray-700">
                                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    {entreprise.adresse && <p>{entreprise.adresse}</p>}
                                    {(entreprise.ville || entreprise.pays) && (
                                        <p className="text-gray-500">
                                            {[entreprise.ville, entreprise.pays].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Finance */}
                    <div>
                        <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                            Finance
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                <span>
                  <strong>{entreprise.devise}</strong>
                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="text-gray-400 text-xs">TVA</span>
                                <span>
                  <strong>{entreprise.tvaPercent}%</strong>
                </span>
                            </div>
                        </div>
                    </div>

                    {/* SIRET */}
                    {entreprise.siret && (
                        <div>
                            <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                                SIRET
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <IdentificationIcon className="h-4 w-4 text-gray-400" />
                                <span>{entreprise.siret}</span>
                            </div>
                        </div>
                    )}

                    {/* Owner */}
                    {entreprise.ownerEmail && (
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Propriétaire : <strong>{entreprise.ownerPrenom} {entreprise.ownerNom}</strong>
                            </p>
                            <p className="text-xs text-gray-400">{entreprise.ownerEmail}</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}