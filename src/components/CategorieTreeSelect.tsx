import { useState, useRef, useEffect, useMemo } from 'react';
import {
    ChevronDownIcon,
    FolderIcon,
    TagIcon,
    CheckIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { CategorieResponse } from '../types/categorie';

interface CategorieTreeSelectProps {
    categories: CategorieResponse[];
    value: number | null;
    onChange: (id: number | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

interface TreeNode extends CategorieResponse {
    children: TreeNode[];
}

export default function CategorieTreeSelect({
                                                categories,
                                                value,
                                                onChange,
                                                placeholder = '-- Choisir une catégorie --',
                                                disabled = false,
                                                className = '',
                                            }: CategorieTreeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Construire l'arbre
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

    // Déplier automatiquement les parents de la valeur sélectionnée à l'ouverture
    useEffect(() => {
        if (isOpen && value) {
            const parentsToExpand = new Set<number>();
            let currentId = value;
            while (currentId) {
                const cat = categories.find((c) => c.id === currentId);
                if (cat && cat.parentId) {
                    parentsToExpand.add(cat.parentId);
                    currentId = cat.parentId;
                } else {
                    break;
                }
            }
            setExpandedIds((prev) => new Set([...prev, ...parentsToExpand]));
        }
    }, [isOpen, value, categories]);

    const selectedCategorie = categories.find((c) => c.id === value);

    const toggleExpand = (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche la sélection de la catégorie
        const next = new Set(expandedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedIds(next);
    };

    // Rendu récursif
    const renderOptions = (nodes: TreeNode[], depth = 0) => {
        return nodes.map((node) => {
            const hasChildren = node.children.length > 0;
            const isExpanded = expandedIds.has(node.id);
            const isSelected = value === node.id;

            return (
                <div key={node.id}>
                    <div
                        className={`flex items-center w-full hover:bg-primary-50 transition-colors ${
                            isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                        style={{ paddingLeft: `${8 + depth * 20}px` }}
                    >
                        {/* Zone Flèche (Déplier / Replier) */}
                        <div
                            className="w-8 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer"
                            onClick={(e) => hasChildren ? toggleExpand(node.id, e) : undefined}
                        >
                            {hasChildren ? (
                                isExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                )
                            ) : (
                                <span className="w-4" /> // spacer pour aligner
                            )}
                        </div>

                        {/* Zone Sélection (Clic sur la catégorie) */}
                        <button
                            type="button"
                            onClick={() => {
                                onChange(node.id);
                                setIsOpen(false);
                            }}
                            className="flex-1 text-left py-2 pr-3 flex items-center gap-2"
                        >
                            {hasChildren ? (
                                <FolderIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            ) : (
                                <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate text-sm font-medium">
                                {node.nom}
                            </span>
                            {isSelected && <CheckIcon className="h-4 w-4 text-primary-600" />}
                        </button>
                    </div>

                    {/* Enfants */}
                    {hasChildren && isExpanded && (
                        <div className="flex flex-col">
                            {renderOptions(node.children, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg flex items-center justify-between text-left focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50 disabled:bg-gray-50 ${
                    isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''
                }`}
            >
                <span className={`block truncate text-sm ${selectedCategorie ? 'text-gray-900' : 'text-gray-500'}`}>
                    {selectedCategorie ? selectedCategorie.cheminComplet || selectedCategorie.nom : placeholder}
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-primary-50 transition-colors ${
                            value === null ? 'bg-primary-50 text-primary-700' : 'text-gray-500'
                        }`}
                    >
                        <span className="flex-1 text-sm italic">Sans catégorie</span>
                        {value === null && <CheckIcon className="h-4 w-4 text-primary-600" />}
                    </button>

                    {tree.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                            Aucune catégorie disponible
                        </div>
                    ) : (
                        renderOptions(tree)
                    )}
                </div>
            )}
        </div>
    );
}