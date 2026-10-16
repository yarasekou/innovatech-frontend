import {
    CubeIcon,
    ShoppingCartIcon,
    UsersIcon,
    TagIcon,
    TruckIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ArrowUturnLeftIcon,
    ShoppingBagIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';

interface PlaceholderPageProps {
    title: string;
    subtitle?: string;
    icon: keyof typeof ICONS;
    description?: string;
}

const ICONS = {
    cube: CubeIcon,
    cart: ShoppingCartIcon,
    users: UsersIcon,
    tag: TagIcon,
    truck: TruckIcon,
    userGroup: UserGroupIcon,
    document: DocumentTextIcon,
    arrowUturn: ArrowUturnLeftIcon,
    shoppingBag: ShoppingBagIcon,
    chart: ChartBarIcon,
};

export default function PlaceholderPage({
                                            title,
                                            subtitle,
                                            icon,
                                            description,
                                        }: PlaceholderPageProps) {
    const Icon = ICONS[icon];

    return (
        <div className="p-8">
            <PageHeader title={title} subtitle={subtitle} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <EmptyState
                    icon={<Icon className="h-16 w-16" />}
                    title="Module en construction"
                    description={description ?? 'Ce module sera bientôt disponible.'}
                />
            </div>
        </div>
    );
}