import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Dropdown from '@/components/Dropdown';

export default function ChatLayout({ children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex h-full items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center space-x-4">
                        <Link href={route('dashboard')} className="flex items-center space-x-2 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-lg transition-transform group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">One Chat</h1>
                                <p className="text-xs text-gray-500">Online messaging</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Link
                                href={route('chat.index')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    route().current('chat.*')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Messages
                            </Link>
                            <Link
                                href={route('users')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    route().current('users')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Users
                            </Link>
                        </div>

                        {/* User Dropdown */}
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                                            {getInitials(user.name)}
                                        </div>
                                        <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
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
            <div className="flex-1 flex flex-col pt-16 w-full">
                {children}
            </div>
        </div>
    );
}

