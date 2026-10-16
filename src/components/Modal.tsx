import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// ============================================================
// Types
// ============================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;   // ← NOUVEAU
}

// ============================================================
// Largeurs disponibles
// ============================================================

const SIZES: Record<ModalSize, string> = {
    sm: 'max-w-sm',      // 24rem  ≈  384px  → petits formulaires
    md: 'max-w-md',      // 28rem  ≈  448px  → défaut actuel
    lg: 'max-w-lg',      // 32rem  ≈  512px
    xl: 'max-w-xl',      // 36rem  ≈  576px
    '2xl': 'max-w-2xl',  // 42rem  ≈  672px  → entreprise, produits
    '3xl': 'max-w-3xl',  // 48rem  ≈  768px  → commandes
    '4xl': 'max-w-4xl',  // 56rem  ≈  896px  → commandes avec lignes
    '5xl': 'max-w-5xl',  // 64rem  ≈ 1024px
    full: 'max-w-full mx-4',  // quasi plein écran
};

// ============================================================
// Composant
// ============================================================

export default function Modal({
                                  isOpen,
                                  onClose,
                                  title,
                                  children,
                                  footer,
                                  size = 'md',   // ← défaut inchangé
                              }: ModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={`w-full ${SIZES[size]} transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="px-6 py-5">{children}</div>

                                {/* Footer */}
                                {footer && (
                                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                                        {footer}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}