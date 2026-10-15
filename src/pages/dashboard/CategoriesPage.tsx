import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    TagIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    FolderIcon,
    FolderOpenIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useCategories } from '../../hooks/useCategories';
import { categorieService } from '../../services/categorieService';
import { useAuthStore } from '../../stores/authStore';
import { isUser as checkIsUser, isSeller as checkIsSeller } from '../../types/auth';
import type { CategorieResponse } from '../../types/categorie';

// ============================================================
// Types
// ============================================================

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface TreeNode extends CategorieResponse {
    children: TreeNode[];
}

// ============================================================
// Validation
// ============================================================

const categorieSchema = z.object({
    nom: z.string().min(2, 'Min 2 caractères').max(150, 'Max 150 caractères'),
    description: z.string().max(500, 'Max 500 caractères').optional(),
    actif: z.boolean(),
});

type CategorieForm = z.infer<typeof categorieSchema>;

// ============================================================
// Composant
// ============================================================

export default function CategoriesPage() {
    const { categories, loading, error, isInspection, reload } = useCategories();
    const authUser = useAuthStore((state) => state.user);
    const roles = authUser?.roles || [];
    const canEdit = (checkIsUser(roles) || checkIsSeller(roles)) && !isInspection;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategorie, setEditingCategorie] = useState<CategorieResponse | null>(null);
    const [parentIdForCreate, setParentIdForCreate] = useState<number | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CategorieForm>({
        resolver: zodResolver(categorieSchema),
        defaultValues: { nom: '', description: '', actif: true },
    });

    // ============================================================
    // Arbre
    // ============================================================
    const tree = useMemo(() => {
        const map = new Map<number, TreeNode>();
        categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

        const roots: TreeNode[] = [];
        categories.forEach((cat) => {
            const node = map.get(cat.id)!;
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    }, [categories]);

    // ============================================================
    // Actions
    // ============================================================

    const toggleExpand = (id: number) => {
        const next = new Set(expandedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedIds(next);
    };

    const onSubmit = async (data: CategorieForm) => {
        try {
            const payload = {
                nom: data.nom,
                description: data.description || undefined,
                actif: data.actif,
                parentId: editingCategorie ? editingCategorie.parentId : parentIdForCreate,
            };

            if (editingCategorie) {
                await categorieService.updateCategorie(editingCategorie.id, payload);
            } else {
                await categorieService.createCategorie(payload);
            }
            closeModal();
            await reload();
        } catch (err: unknown) {
            const error = err as ApiError;
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const openCreateModal = (parentId: number | null = null) => {
        setEditingCategorie(null);
        setParentIdForCreate(parentId);
        reset({ nom: '', description: '', actif: true });
        setIsModalOpen(true);
    };

    const openEditModal = (cat: CategorieResponse) => {
        setEditingCategorie(cat);
        setParentIdForCreate(null);
        reset({
            nom: cat.nom,
            description: cat.description || '',
            actif: cat.actif,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategorie(null);
        setParentIdForCreate(null);
        reset();
    };

    const handleDelete = async (cat: CategorieResponse) => {
        const ok = confirm(`Supprimer la catégorie "${cat.nom}" ?`);
        if (!ok) return;

        try {
            await categorieService.deleteCategorie(cat.id);
            await reload();
        } catch (err: unknown) {
            const error = err as ApiError;
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    // ============================================================
    // Rendu récursif
    // ============================================================

    const renderNode = (node: TreeNode, depth: number = 0, isLast: boolean = false) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);

        // Style selon le niveau
        const isRoot = depth === 0;
        const isLeaf = !hasChildren;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-3 py-3 hover:bg-gray-50 border-b border-gray-100 group ${
                        isRoot ? 'bg-gray-50/50' : ''
                    }`}
                    style={{ paddingLeft: `${16 + depth * 32}px`, paddingRight: '16px' }}
                >
                    {/* Lignes de connexion visuelles */}
                    {depth > 0 && (
                        <span className="text-gray-300 font-mono select-none">
              {isLast ? '└─' : '├─'}
            </span>
                    )}

                    {/* Flèche expand/collapse */}
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpand(node.id)}
                            className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                            )}
                        </button>
                    ) : (
                        <span className="w-6" />
                    )}

                    {/* Icône différenciée */}
                    {isLeaf ? (
                        <TagIcon className="h-5 w-5 text-gray-400" />
                    ) : isExpanded ? (
                        <FolderOpenIcon className="h-6 w-6 text-amber-500" />
                    ) : (
                        <FolderIcon className="h-6 w-6 text-amber-500" />
                    )}

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                        <p
                            className={`truncate ${
                                isRoot
                                    ? 'text-base font-bold text-gray-900'
                                    : isLeaf
                                        ? 'text-sm text-gray-700'
                                        : 'text-sm font-semibold text-gray-800'
                            }`}
                        >
                            {node.nom}
                        </p>
                        {!isLeaf && (
                            <p className="text-xs text-gray-400">
                                {node.children.length} sous-catégorie
                                {node.children.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Badge inactif */}
                    {!node.actif && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              Inactif
            </span>
                    )}

                    {/* Actions */}
                    {canEdit && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openCreateModal(node.id)}
                                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title="Ajouter une sous-catégorie"
                            >
                                <PlusIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => openEditModal(node)}
                                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title="Modifier"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(node)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Supprimer"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Enfants */}
                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map((child, idx) =>
                            renderNode(child, depth + 1, idx === node.children.length - 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // Rendu
    // ============================================================
    return (
        <div className="p-8">
            <PageHeader
                title="Catégories"
                subtitle={
                    isInspection
                        ? 'Catégories de cette entreprise (lecture seule)'
                        : canEdit
                            ? 'Organisez vos produits par catégories'
                            : 'Catégories de votre entreprise'
                }
                actions={
                    canEdit ? (
                        <Button
                            icon={<PlusIcon className="h-5 w-5" />}
                            onClick={() => openCreateModal(null)}
                        >
                            Nouvelle catégorie
                        </Button>
                    ) : undefined
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : categories.length === 0 ? (
                    <EmptyState
                        icon={<TagIcon className="h-16 w-16" />}
                        title="Aucune catégorie"
                        description={
                            isInspection
                                ? 'Cette entreprise n\'a aucune catégorie.'
                                : 'Commencez par créer votre première catégorie.'
                        }
                        action={
                            canEdit ? (
                                <Button
                                    icon={<PlusIcon className="h-5 w-5" />}
                                    onClick={() => openCreateModal(null)}
                                >
                                    Créer une catégorie
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div>{tree.map((node, idx) => renderNode(node, 0, idx === tree.length - 1))}</div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button type="submit" form="categorie-form" loading={isSubmitting}>
                            {editingCategorie ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </>
                }
            >
                <form id="categorie-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom *
                        </label>
                        <input
                            {...register('nom')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Accessoires"
                        />
                        {errors.nom && (
                            <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Description…"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="actif"
                            {...register('actif')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="actif" className="text-sm text-gray-700">
                            Catégorie active
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
}