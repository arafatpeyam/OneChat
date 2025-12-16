import { Link, usePage } from '@inertiajs/react';
import { memo, useMemo, useCallback } from 'react';
import Dropdown from '@/components/Dropdown';
import NotificationBar from '@/components/NotificationBar';

function ChatLayout({ children }) {
    const user = usePage().props.auth.user;

    const getInitials = useCallback((name) => {
        if (!name || typeof name !== 'string') {
            return 'U';
        }
        const initials = name
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return initials || 'U';
    }, []);

    // Memoize user role check
    const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

    return (
        <div className="flex h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-sm border-b border-cyan-200 shadow-sm">
                <div className="flex h-full items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center space-x-4">
                        <Link href={isAdmin ? route('dashboard') : route('chat.index')} className="flex items-center space-x-2 group">
                            <div>
                                <h1 className="text-2xl font-medium bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent hover:from-cyan-700 hover:via-teal-600 hover:to-blue-700 transition-all duration-200">
                                    OneChat
                                </h1>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                href={route('chat.index')}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    route().current('chat.*')
                                        ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 scale-105'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Messages
                            </Link>
                            <Link
                                href={route('blood-donation.index')}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    route().current('blood-donation.*')
                                        ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 scale-105'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Blood Donation
                            </Link>
                            <Link
                                href={route('friends.index')}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    route().current('friends.*')
                                        ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 scale-105'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Friends
                            </Link>
                            <Link
                                href={route('emergency.index')}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    route().current('emergency.*')
                                        ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 scale-105'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Emergency
                            </Link>
                        </div>

                        {/* Notification Bar */}
                        <NotificationBar 
                            initialNotifications={usePage().props.notifications || []}
                            initialUnreadCount={usePage().props.unread_notification_count || 0}
                        />

                        {/* User Dropdown */}
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-cyan-50 transition-colors">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-sm font-bold text-white">
                                            {getInitials(user?.name)}
                                        </div>
                                        <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col pt-14 w-full">
                {children}
            </div>
        </div>
    );
}

export default memo(ChatLayout);

