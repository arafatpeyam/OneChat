import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none ' +
                (active
                    ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105') +
                ' ' + className
            }
        >
            {children}
        </Link>
    );
}
