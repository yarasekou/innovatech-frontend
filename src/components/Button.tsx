import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
    loading?: boolean;
    children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'text-gray-700 hover:bg-gray-100',
};

const SIZES: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
                                   variant = 'primary',
                                   size = 'md',
                                   icon,
                                   loading = false,
                                   children,
                                   className = '',
                                   disabled,
                                   ...props
                               }: ButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        >
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
                icon
            )}
            {children}
        </button>
    );
}