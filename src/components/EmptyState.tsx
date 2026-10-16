import type { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;   // ← optionnel
    action?: ReactNode;
}

export default function EmptyState({
                                       icon,
                                       title,
                                       description,
                                       action,
                                   }: EmptyStateProps) {
    return (
        <div className="text-center py-12 px-6">
            {icon && (
                <div className="flex justify-center mb-4 text-gray-300">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    {description}
                </p>
            )}
            {action && <div className="flex justify-center">{action}</div>}
        </div>
    );
}