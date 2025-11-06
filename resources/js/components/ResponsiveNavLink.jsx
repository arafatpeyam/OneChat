import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 focus:outline-none ${
                active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
